/**
 * Entorno de DESARROLLO (`npm start` / `ng serve`).
 *
 * El frontend corre en http://localhost:4200 y llama a la API local de
 * FastAPI. El backend siempre permite el origen `http://localhost:4200`
 * en CORS, así que no se necesita proxy.
 *
 * En producción (`npm run build`) Angular reemplaza este archivo por
 * `environment.prod.ts` (ver `fileReplacements` en angular.json).
 */
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api',
};
