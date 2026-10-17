import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion';

/** Firma un token JWT para el usuario indicado. */
export function signToken(userId) {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: '30d' });
}

/** Middleware: exige un token válido y deja el id en req.userId. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Falta el token de sesión.' });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.userId = Number(payload.sub);
    next();
  } catch {
    res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }
}

/** Convierte una fila de la base de datos al formato que espera la app. */
export function mapUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    email: row.email,
    avatar: row.avatar || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

/** Versión pública (sin correo) para mostrar autorías de recetas. */
export function mapPublicUser(row) {
  return {
    id: String(row.id),
    name: row.name,
    avatar: row.avatar || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

/** Envoltorio para manejar errores de rutas async sin try/catch repetido. */
export function handle(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Crea un error HTTP rápido. */
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
