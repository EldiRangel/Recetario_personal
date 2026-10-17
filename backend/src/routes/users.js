import { Router } from 'express';

import { pool } from '../db.js';
import { handle, mapPublicUser, requireAuth } from '../auth.js';

const router = Router();

router.use(requireAuth);

// GET /api/users — lista pública (sin correos) para mostrar autorías.
router.get(
  '/',
  handle(async (_req, res) => {
    const result = await pool.query('SELECT id, name, avatar, created_at FROM users ORDER BY id');
    res.json({ users: result.rows.map(mapPublicUser) });
  })
);

export default router;
