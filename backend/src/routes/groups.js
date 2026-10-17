import { Router } from 'express';

import { pool } from '../db.js';
import { handle, httpError, requireAuth } from '../auth.js';

const router = Router();

router.use(requireAuth);

function mapGroup(row) {
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || undefined,
    recipeIds: (row.recipe_ids || []).map(String),
    createdBy: String(row.created_by),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

// GET /api/groups — solo los grupos propios (con sus recetas).
router.get(
  '/',
  handle(async (req, res) => {
    const result = await pool.query(
      `SELECT g.*,
              COALESCE(array_agg(rg.recipe_id) FILTER (WHERE rg.recipe_id IS NOT NULL), '{}') AS recipe_ids
       FROM groups g
       LEFT JOIN recipe_groups rg ON rg.group_id = g.id
       WHERE g.created_by = $1
       GROUP BY g.id
       ORDER BY LOWER(g.name)`,
      [req.userId]
    );
    res.json({ groups: result.rows.map(mapGroup) });
  })
);

function validateGroupBody(body, { partial = false } = {}) {
  if (!partial || body.name !== undefined) {
    const name = (body.name || '').trim();
    if (name.length < 3 || name.length > 50) {
      throw httpError(400, 'El nombre debe tener entre 3 y 50 caracteres.');
    }
  }
  if (body.description && String(body.description).length > 200) {
    throw httpError(400, 'La descripción no puede superar 200 caracteres.');
  }
}

// POST /api/groups
router.post(
  '/',
  handle(async (req, res) => {
    const body = req.body || {};
    validateGroupBody(body);

    const name = body.name.trim();
    const dup = await pool.query(
      'SELECT id FROM groups WHERE created_by = $1 AND LOWER(name) = LOWER($2)',
      [req.userId, name]
    );
    if (dup.rowCount > 0) {
      throw httpError(409, 'Ya existe un grupo con este nombre.');
    }

    const result = await pool.query(
      'INSERT INTO groups (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, body.description || null, req.userId]
    );
    res.status(201).json({ group: mapGroup({ ...result.rows[0], recipe_ids: [] }) });
  })
);

// PUT /api/groups/:id
router.put(
  '/:id',
  handle(async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const existing = await pool.query('SELECT * FROM groups WHERE id = $1 AND created_by = $2', [
      id,
      req.userId,
    ]);
    if (existing.rowCount === 0) {
      throw httpError(404, 'Grupo no encontrado.');
    }

    validateGroupBody(body, { partial: true });

    if (body.name !== undefined) {
      const dup = await pool.query(
        'SELECT id FROM groups WHERE created_by = $1 AND LOWER(name) = LOWER($2) AND id <> $3',
        [req.userId, body.name.trim(), id]
      );
      if (dup.rowCount > 0) {
        throw httpError(409, 'Ya existe otro grupo con este nombre.');
      }
    }

    const current = existing.rows[0];
    const result = await pool.query(
      'UPDATE groups SET name = $1, description = $2, updated_at = now() WHERE id = $3 RETURNING *',
      [
        body.name !== undefined ? body.name.trim() : current.name,
        body.description !== undefined ? body.description || null : current.description,
        id,
      ]
    );

    const links = await pool.query('SELECT recipe_id FROM recipe_groups WHERE group_id = $1', [id]);
    res.json({
      group: mapGroup({ ...result.rows[0], recipe_ids: links.rows.map((r) => r.recipe_id) }),
    });
  })
);

// DELETE /api/groups/:id
// Misma regla que en la app: las recetas propias que solo pertenecían a este
// grupo se borran; las que están en otros grupos solo se desvinculan.
router.delete(
  '/:id',
  handle(async (req, res) => {
    const id = Number(req.params.id);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const group = await client.query('SELECT id FROM groups WHERE id = $1 AND created_by = $2', [
        id,
        req.userId,
      ]);
      if (group.rowCount === 0) {
        throw httpError(404, 'Grupo no encontrado.');
      }

      // Recetas propias exclusivas de este grupo -> se eliminan.
      await client.query(
        `DELETE FROM recipes r
         WHERE r.created_by = $1
           AND EXISTS (SELECT 1 FROM recipe_groups rg WHERE rg.recipe_id = r.id AND rg.group_id = $2)
           AND NOT EXISTS (
             SELECT 1 FROM recipe_groups rg2
             WHERE rg2.recipe_id = r.id AND rg2.group_id <> $2
           )`,
        [req.userId, id]
      );

      // Desvincular el resto y borrar el grupo.
      await client.query('DELETE FROM recipe_groups WHERE group_id = $1', [id]);
      await client.query('DELETE FROM groups WHERE id = $1', [id]);

      await client.query('COMMIT');
      res.json({ ok: true });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

export default router;
