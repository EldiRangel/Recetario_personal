import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';

import { pool } from '../db.js';
import { handle, httpError, mapUser, requireAuth } from '../auth.js';

const router = Router();

router.use(requireAuth);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// La foto se recibe como archivo (multipart) y se guarda en base64 dentro de
// la base de datos: así sobrevive a los reinicios del disco efímero de Render.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

// GET /api/profile — devuelve la cuenta del token actual.
router.get(
  '/',
  handle(async (req, res) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);
    if (result.rowCount === 0) {
      throw httpError(404, 'Cuenta no encontrada.');
    }
    res.json({ user: mapUser(result.rows[0]) });
  })
);

// PUT /api/profile  { name?, email?, password? }
router.put(
  '/',
  handle(async (req, res) => {
    const { name, email, password } = req.body || {};

    const updates = [];
    const values = [];
    let i = 1;

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (trimmed.length < 2 || trimmed.length > 16) {
        throw httpError(400, 'El nombre debe tener entre 2 y 16 caracteres.');
      }
      updates.push(`name = $${i++}`);
      values.push(trimmed);
    }

    if (email !== undefined) {
      const normalized = String(email).trim().toLowerCase();
      if (normalized.length > 100 || !EMAIL_REGEX.test(normalized)) {
        throw httpError(400, 'Ingresa un correo electrónico válido.');
      }
      const taken = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [
        normalized,
        req.userId,
      ]);
      if (taken.rowCount > 0) {
        throw httpError(409, 'Ya existe una cuenta registrada con este correo.');
      }
      updates.push(`email = $${i++}`);
      values.push(normalized);
    }

    if (password !== undefined) {
      if (password.length < 6 || password.length > 16) {
        throw httpError(400, 'La contraseña debe tener entre 6 y 16 caracteres.');
      }
      updates.push(`password_hash = $${i++}`);
      values.push(await bcrypt.hash(password, 10));
    }

    if (updates.length === 0) {
      throw httpError(400, 'No hay cambios para guardar.');
    }

    values.push(req.userId);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    res.json({ user: mapUser(result.rows[0]) });
  })
);

// PUT /api/profile/avatar  { avatar: dataUrl | null }
router.put(
  '/avatar',
  handle(async (req, res) => {
    const { avatar } = req.body || {};
    const result = await pool.query('UPDATE users SET avatar = $1 WHERE id = $2 RETURNING *', [
      avatar || null,
      req.userId,
    ]);
    res.json({ user: mapUser(result.rows[0]) });
  })
);

// POST /api/profile/avatar (multipart con campo "avatar")
router.post(
  '/avatar',
  upload.single('avatar'),
  handle(async (req, res) => {
    if (!req.file) {
      throw httpError(400, 'Falta la imagen del avatar.');
    }
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const result = await pool.query('UPDATE users SET avatar = $1 WHERE id = $2 RETURNING *', [
      dataUrl,
      req.userId,
    ]);
    res.json({ user: mapUser(result.rows[0]) });
  })
);

// DELETE /api/profile — elimina la cuenta (las recetas y grupos caen en cascada).
router.delete(
  '/',
  handle(async (req, res) => {
    await pool.query('DELETE FROM users WHERE id = $1', [req.userId]);
    res.json({ ok: true });
  })
);

export default router;
