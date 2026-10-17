import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { initDb } from './db.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import recipeRoutes from './routes/recipes.js';
import groupRoutes from './routes/groups.js';
import userRoutes from './routes/users.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Endpoint de salud: lo usa Render para saber si el servicio está activo.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'recetario-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/users', userRoutes);

// 404 para rutas inexistentes.
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejador central de errores.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error del servidor.' });
});

const port = process.env.PORT || 4000;

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`API del recetario escuchando en el puerto ${port}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
