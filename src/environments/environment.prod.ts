/**
 * Entorno de PRODUCCIÓN (Render). Se usa en `npm run build` gracias a
 * `fileReplacements` en angular.json.
 *
 * `apiUrl` apunta al backend desplegado en Render y DEBE terminar en `/api`:
 * los servicios construyen rutas como `${environment.apiUrl}/auth/login`.
 * El origen de este frontend debe estar en `CORS_ORIGINS` del backend.
 */
export const environment = {
  production: true,
  apiUrl: 'https://backend-mqef.onrender.com/api',
};
