# AYNI · Frontend (Angular 22)

SPA de la plataforma **AYNI** para la gestión de Ollas Comunes: portal público (KPIs, directorio de ollas, registro),
panel de la dirigenta (mi olla, inventario PEPS, donaciones, receta del día con botón «Otra receta», reportes). Las cantidades se registran en kg, L o unidades, con conversión automática desde gramos, sacos, ml, botellas, galoneras, docenas o cajas y panel de administración.

- **Stack:** Angular 22 (standalone components + signals, rutas con carga diferida), CSS propio con base Bootstrap 5.0.2 (CDN), accesibilidad WCAG 2.1 AA.
- **Backend:** API FastAPI desplegada en Render → `https://backend-mqef.onrender.com` (documentación en `/docs`).

## Estructura

```text
src/
├── app/
│   ├── core/          ← servicios tipados por router de la API, models.ts, authGuard/roleGuard,
│   │                    interceptor JWT, toasts y control de tamaño de letra
│   ├── features/      ← publico · auth · panel · admin
│   ├── app.routes.ts  ← rutas con loadComponent y guards por rol
│   └── app.config.ts  ← provideHttpClient(withInterceptors([authInterceptor]))
├── environments/
│   ├── environment.ts       ← desarrollo: http://127.0.0.1:8000/api
│   └── environment.prod.ts  ← producción: https://backend-mqef.onrender.com/api
└── styles.css         ← sistema de diseño global
server.mjs             ← servidor de producción (Node nativo, sin dependencias)
render.yaml            ← definición del Web Service en Render
```

## Desarrollo local

```powershell
npm install
```

```powershell
npm start
```

Abre <http://localhost:4200>. Requiere la API local en `http://127.0.0.1:8000` (el backend siempre permite el origen `http://localhost:4200`).

## Build de producción

```powershell
npm run build
```

Genera `dist/frontend/browser` usando `environment.prod.ts` (configurado con `fileReplacements` en `angular.json`).
Para probarlo como en Render:

```powershell
$env:PORT = "8080"; npm run serve:prod
```

Abre <http://localhost:8080>. `server.mjs` sirve los archivos estáticos con **fallback de SPA** (cualquier ruta sin
extensión devuelve `index.html`, así recargar `/panel/inventario` funciona), caché larga para los archivos con hash,
`no-cache` para `index.html` y `GET /healthz` para el health check.

## Despliegue en Render (Web Service, plan gratuito)

`render.yaml` define el servicio:

| Campo | Valor |
|---|---|
| Nombre / URL | `ayni-frontend` → `https://frontend-qwpp.onrender.com` |
| Runtime | Node 24 (`NODE_VERSION=24`, también `.node-version`) |
| Build Command | `npm ci --include=dev && npm run build` |
| Start Command | `node server.mjs` |
| Health Check Path | `/healthz` |
| Plan | Free (512 MB de RAM; el servidor usa ≈ 50 MB) |
| Auto-Deploy | **Off** (`autoDeploy: false`): el despliegue lo dispara GitHub Actions |

Pasos:

1. Subir este repositorio a GitHub (`main`).
2. En Render: **New → Blueprint** → repositorio `Frontend` (usa `render.yaml`). También puede crearse un *Web Service* manual con los valores de la tabla.
3. **CORS (obligatorio):** en el servicio del **backend**, la variable `CORS_ORIGINS=https://frontend-qwpp.onrender.com` (sin `/` final) y reiniciar el backend (ya configurado). Sin este paso el navegador bloquea las llamadas a la API.
4. Verificar `https://frontend-qwpp.onrender.com/healthz`, abrir el portal, iniciar sesión y recargar una ruta interna (p. ej. `/panel/mi-olla`).

> En el plan gratuito los servicios se suspenden tras ~15 minutos sin tráfico: la primera visita puede tardar cerca de un minuto (frontend y backend).

## CI/CD con GitHub Actions

Workflow: `.github/workflows/ci-cd.yml`, se ejecuta en cada **push a `main`**:

| Job | Qué hace |
|---|---|
| `build-and-test` | Node 24 → `npm ci --include=dev` → `npm test --if-present` (tests si existe el script) → `npm run build` (producción) |
| `deploy` (`needs: build-and-test`, `timeout-minutes: 5`) | Solo si el job anterior pasa en verde y es un push a `main`: `curl --fail-with-body --silent --show-error --request POST` al **Deploy Hook** de Render. No sube `dist/`: Render vuelve a compilar con `render.yaml`. |

- **Secreto requerido:** `HOOK_RENDER_FRONTEND` (*Settings → Secrets and variables → Actions*), con la Deploy Hook URL del servicio (Render → *Settings → Deploy Hook*).
- **Auto-Deploy desactivado:** `render.yaml` tiene `autoDeploy: false`. Si el servicio se creó a mano (no como Blueprint), desactívelo también en el panel: *Settings → Build & Deploy → Auto-Deploy: Off*. Si queda activo, cada push despliega dos veces y Render publicaría incluso builds rotos.

## Usuarios de prueba

| Correo | Rol |
|---|---|
| `admin@ayni.org` | ADMIN |
| `dirigenta@ayni.org` | DIRIGENTA |
| `maria.condori@ayni.org` | DIRIGENTA |

Las contraseñas se definen en el backend; no se publican en este repositorio.
