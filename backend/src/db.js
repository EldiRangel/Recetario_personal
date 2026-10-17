import { Pool } from 'pg';

// Supabase y Render exigen SSL; con certificado autofirmado, por eso se omite
// la verificación solo para esos hosts.
function buildSslConfig() {
  if (process.env.PG_SSL === 'true') return { rejectUnauthorized: false };
  try {
    const host = new URL(process.env.DATABASE_URL).hostname;
    if (host.endsWith('render.com') || host.endsWith('supabase.co') || host.endsWith('supabase.com')) {
      return { rejectUnauthorized: false };
    }
  } catch {
    // URL inválida: se deja que pg gestione la conexión.
  }
  return undefined;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: buildSslConfig(),
});

// Crea las tablas si no existen. Es idempotente, así que puede ejecutarse
// en cada arranque sin problema.
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      ingredients JSONB NOT NULL DEFAULT '[]',
      steps JSONB NOT NULL DEFAULT '[]',
      category TEXT,
      prep_time TEXT,
      cook_time TEXT,
      servings INTEGER,
      image TEXT,
      is_public BOOLEAN NOT NULL DEFAULT TRUE,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS groups (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS recipe_groups (
      recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (recipe_id, group_id)
    );
  `);
}
