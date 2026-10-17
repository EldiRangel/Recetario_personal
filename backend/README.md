# Backend del Recetario

API REST en **Node.js + Express + PostgreSQL**. Guarda usuarios, recetas y
grupos en la nube para que todas las personas que usen la app compartan las
recetas públicas entre sí.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Crear cuenta (devuelve token JWT) |
| POST | `/api/auth/login` | Iniciar sesión (devuelve token JWT) |
| GET | `/api/users` | Lista pública de usuarios (nombre y avatar) |
| GET | `/api/recipes` | Recetas propias + todas las públicas |
| POST | `/api/recipes` | Crear receta |
| PUT | `/api/recipes/:id` | Editar receta propia |
| DELETE | `/api/recipes/:id` | Borrar receta propia |
| POST | `/api/recipes/:id/groups/:groupId` | Asociar receta a un grupo |
| DELETE | `/api/recipes/:id/groups/:groupId` | Desvincular receta de un grupo |
| GET | `/api/groups` | Grupos propios |
| POST | `/api/groups` | Crear grupo |
| PUT | `/api/groups/:id` | Editar grupo propio |
| DELETE | `/api/groups/:id` | Borrar grupo propio |
| PUT | `/api/profile` | Actualizar nombre/correo/contraseña |
| PUT | `/api/profile/avatar` | Guardar avatar (base64) |
| DELETE | `/api/profile` | Eliminar la cuenta y todo lo asociado |
| GET | `/api/health` | Salud del servicio (lo usa Render) |

## Ejecutar en local

1. El backend lee su configuración de `backend/.env` (cópialo de
   `.env.example`):
   - `DATABASE_URL`: cadena de conexión de Supabase
     (**Connect → Direct → Connection Method: Session pooler**, puerto 5432).
   - `JWT_SECRET`: cualquier cadena larga.
2. Arranca:

```bash
cd backend
cp .env.example .env   # edita .env con tu DATABASE_URL y JWT_SECRET
npm install
npm run dev
```

La API queda en `http://localhost:4000`. Las tablas se crean solas la primera
vez que arranca.

## Deploy en Render (la nube)

La base de datos vive en **Supabase** (plan gratis). Se usa el *Session pooler*
(puerto 5432) porque Render solo tiene IPv4 y la conexión directa de Supabase
requiere IPv6.

1. Sube el proyecto completo a GitHub (rama `main`).
2. En [render.com](https://render.com) → **New** → **Blueprint** → selecciona
   el repositorio. Render leerá `render.yaml` y creará el servicio web
   `recetario-api` (desde la carpeta `backend/`).
3. Cuando Render pida el valor de `DATABASE_URL`, pega la cadena de Supabase
   (Session pooler, con la contraseña ya puesta). `JWT_SECRET` se genera solo.
4. Espera a que el servicio pase a **Live**. La API queda en
   `https://recetario-api-y4ki.onrender.com`.
5. Prueba `https://recetario-api-y4ki.onrender.com/api/health`: debe responder
   `{"ok":true,"service":"recetario-api"}`.

> Los servicios gratis de Render se duermen pasados unos minutos sin tráfico:
> la primera petición tras el reposo tarda ~30 s mientras el servicio despierta.

## Conectar la app

En la raíz del proyecto (app Expo) el archivo `.env` define la URL:

```
EXPO_PUBLIC_API_URL=https://recetario-api-y4ki.onrender.com
```

Para builds con EAS, esa variable debe estar disponible; puedes definirla en
`eas.json` dentro de cada perfil con `"env": { ... }` o con `eas env:create`.
