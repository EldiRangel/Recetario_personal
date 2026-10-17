import { Router } from 'express';

import { pool } from '../db.js';
import { handle, httpError, requireAuth } from '../auth.js';

const router = Router();

router.use(requireAuth);

// Convierte una fila de receta (con group_ids agregado) al formato de la app.
function mapRecipe(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    ingredients: row.ingredients,
    steps: row.steps,
    category: row.category || undefined,
    prepTime: row.prep_time || undefined,
    cookTime: row.cook_time || undefined,
    servings: row.servings ?? undefined,
    image: row.image || undefined,
    groupIds: (row.group_ids || []).map(String),
    isPublic: row.is_public,
    createdBy: String(row.created_by),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

// GET /api/recipes — las propias del usuario + todas las públicas.
router.get(
  '/',
  handle(async (req, res) => {
    const result = await pool.query(
      `SELECT r.*, u.name AS author_name, u.avatar AS author_avatar,
              COALESCE(array_agg(rg.group_id) FILTER (WHERE rg.group_id IS NOT NULL), '{}') AS group_ids
       FROM recipes r
       JOIN users u ON u.id = r.created_by
       LEFT JOIN recipe_groups rg ON rg.recipe_id = r.id
       WHERE r.created_by = $1 OR r.is_public
       GROUP BY r.id, u.name, u.avatar
       ORDER BY LOWER(r.title)`,
      [req.userId]
    );
    res.json({ recipes: result.rows.map(mapRecipe) });
  })
);

// Valida los datos comunes de creación/edición.
function validateRecipeBody(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || body.title !== undefined) {
    const title = (body.title || '').trim();
    if (title.length < 3 || title.length > 60) {
      errors.push('El título debe tener entre 3 y 60 caracteres.');
    }
  }
  if (body.description && String(body.description).length > 300) {
    errors.push('La descripción no puede superar 300 caracteres.');
  }
  if (!Array.isArray(body.ingredients) || !Array.isArray(body.steps)) {
    if (!partial) errors.push('Ingredientes y pasos deben ser listas.');
  }
  if (errors.length > 0) throw httpError(400, errors.join(' '));
}

// Comprueba que los grupos enviados pertenezcan al usuario; devuelve sus ids.
async function ownGroupIds(userId, groupIds) {
  if (!Array.isArray(groupIds) || groupIds.length === 0) return [];
  const ids = groupIds.map(Number).filter(Number.isInteger);
  const result = await pool.query(
    'SELECT id FROM groups WHERE created_by = $1 AND id = ANY($2::int[])',
    [userId, ids]
  );
  return result.rows.map((r) => r.id);
}

// POST /api/recipes
router.post(
  '/',
  handle(async (req, res) => {
    const body = req.body || {};
    validateRecipeBody(body);

    const title = body.title.trim();
    const dup = await pool.query(
      'SELECT id FROM recipes WHERE created_by = $1 AND LOWER(title) = LOWER($2)',
      [req.userId, title]
    );
    if (dup.rowCount > 0) {
      throw httpError(409, 'Ya existe una receta con este título.');
    }

    const groupIds = await ownGroupIds(req.userId, body.groupIds);

    const result = await pool.query(
      `INSERT INTO recipes (title, description, ingredients, steps, category, prep_time, cook_time, servings, image, is_public, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        title,
        body.description || '',
        JSON.stringify(body.ingredients || []),
        JSON.stringify(body.steps || []),
        body.category || null,
        body.prepTime || null,
        body.cookTime || null,
        body.servings ?? null,
        body.image || null,
        body.isPublic !== false,
        req.userId,
      ]
    );

    const recipe = result.rows[0];
    if (groupIds.length > 0) {
      await pool.query(
        'INSERT INTO recipe_groups (recipe_id, group_id) SELECT $1, unnest($2::int[])',
        [recipe.id, groupIds]
      );
    }

    res.status(201).json({ recipe: mapRecipe({ ...recipe, group_ids: groupIds }) });
  })
);

// PUT /api/recipes/:id
router.put(
  '/:id',
  handle(async (req, res) => {
    const id = Number(req.params.id);
    const body = req.body || {};

    const existing = await pool.query('SELECT * FROM recipes WHERE id = $1 AND created_by = $2', [
      id,
      req.userId,
    ]);
    if (existing.rowCount === 0) {
      throw httpError(404, 'Receta no encontrada.');
    }

    validateRecipeBody(body, { partial: true });

    if (body.title !== undefined) {
      const dup = await pool.query(
        'SELECT id FROM recipes WHERE created_by = $1 AND LOWER(title) = LOWER($2) AND id <> $3',
        [req.userId, body.title.trim(), id]
      );
      if (dup.rowCount > 0) {
        throw httpError(409, 'Ya existe otra receta con este título.');
      }
    }

    const current = existing.rows[0];
    const result = await pool.query(
      `UPDATE recipes SET
         title = $1, description = $2, ingredients = $3, steps = $4,
         category = $5, prep_time = $6, cook_time = $7, servings = $8,
         is_public = $9, updated_at = now()
       WHERE id = $10
       RETURNING *`,
      [
        body.title !== undefined ? body.title.trim() : current.title,
        body.description !== undefined ? body.description : current.description,
        JSON.stringify(body.ingredients !== undefined ? body.ingredients : current.ingredients),
        JSON.stringify(body.steps !== undefined ? body.steps : current.steps),
        body.category !== undefined ? body.category || null : current.category,
        body.prepTime !== undefined ? body.prepTime || null : current.prep_time,
        body.cookTime !== undefined ? body.cookTime || null : current.cook_time,
        body.servings !== undefined ? body.servings ?? null : current.servings,
        body.isPublic !== undefined ? body.isPublic : current.is_public,
        id,
      ]
    );

    // Sincronizar grupos solo si la petición los trae.
    let groupIds = null;
    if (body.groupIds !== undefined) {
      groupIds = await ownGroupIds(req.userId, body.groupIds);
      await pool.query('DELETE FROM recipe_groups WHERE recipe_id = $1', [id]);
      if (groupIds.length > 0) {
        await pool.query(
          'INSERT INTO recipe_groups (recipe_id, group_id) SELECT $1, unnest($2::int[])',
          [id, groupIds]
        );
      }
    } else {
      const links = await pool.query('SELECT group_id FROM recipe_groups WHERE recipe_id = $1', [id]);
      groupIds = links.rows.map((r) => r.group_id);
    }

    res.json({ recipe: mapRecipe({ ...result.rows[0], group_ids: groupIds }) });
  })
);

// DELETE /api/recipes/:id
router.delete(
  '/:id',
  handle(async (req, res) => {
    const id = Number(req.params.id);
    const result = await pool.query('DELETE FROM recipes WHERE id = $1 AND created_by = $2', [
      id,
      req.userId,
    ]);
    if (result.rowCount === 0) {
      throw httpError(404, 'Receta no encontrada.');
    }
    res.json({ ok: true });
  })
);

// POST /api/recipes/:id/groups/:groupId — asocia la receta a un grupo propio.
router.post(
  '/:id/groups/:groupId',
  handle(async (req, res) => {
    const recipeId = Number(req.params.id);
    const groupId = Number(req.params.groupId);

    const recipe = await pool.query('SELECT id FROM recipes WHERE id = $1 AND created_by = $2', [
      recipeId,
      req.userId,
    ]);
    if (recipe.rowCount === 0) throw httpError(404, 'Receta no encontrada.');

    const group = await pool.query('SELECT id FROM groups WHERE id = $1 AND created_by = $2', [
      groupId,
      req.userId,
    ]);
    if (group.rowCount === 0) throw httpError(404, 'Grupo no encontrado.');

    await pool.query(
      'INSERT INTO recipe_groups (recipe_id, group_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [recipeId, groupId]
    );
    res.json({ ok: true });
  })
);

// DELETE /api/recipes/:id/groups/:groupId — desvincula la receta del grupo.
router.delete(
  '/:id/groups/:groupId',
  handle(async (req, res) => {
    const recipeId = Number(req.params.id);
    const groupId = Number(req.params.groupId);

    const recipe = await pool.query('SELECT id FROM recipes WHERE id = $1 AND created_by = $2', [
      recipeId,
      req.userId,
    ]);
    if (recipe.rowCount === 0) throw httpError(404, 'Receta no encontrada.');

    await pool.query('DELETE FROM recipe_groups WHERE recipe_id = $1 AND group_id = $2', [
      recipeId,
      groupId,
    ]);
    res.json({ ok: true });
  })
);

export default router;
