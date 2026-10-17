import { Router } from 'express';
import bcrypt from 'bcryptjs';

import { pool } from '../db.js';
import { handle, httpError, mapUser, signToken } from '../auth.js';

const router = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post(
  '/register',
  handle(async (req, res) => {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!name || !email || !password) {
      throw httpError(400, 'Nombre, correo y contraseña son obligatorios.');
    }
    if (name.length < 2 || name.length > 16) {
      throw httpError(400, 'El nombre debe tener entre 2 y 16 caracteres.');
    }
    if (email.length > 100 || !EMAIL_REGEX.test(email)) {
      throw httpError(400, 'Ingresa un correo electrónico válido.');
    }
    if (password.length < 6 || password.length > 16) {
      throw httpError(400, 'La contraseña debe tener entre 6 y 16 caracteres.');
    }

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      throw httpError(409, 'Ya existe una cuenta registrada con este correo.');
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hash]
    );

    const user = mapUser(result.rows[0]);
    res.status(201).json({ token: signToken(user.id), user });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  handle(async (req, res) => {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      throw httpError(400, 'Correo y contraseña son obligatorios.');
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const row = result.rows[0];

    if (!row || !(await bcrypt.compare(password, row.password_hash))) {
      throw httpError(401, 'Correo o contraseña incorrectos.');
    }

    const user = mapUser(row);
    res.json({ token: signToken(user.id), user });
  })
);

export default router;
