/**
 * AYNI · Servidor de producción del frontend (Render Web Service).
 *
 * Sirve el build estático de Angular (`dist/frontend/browser`) sin
 * dependencias externas (solo módulos nativos de Node), para mantener el
 * consumo de memoria muy por debajo de los 512 MB del plan gratuito.
 *
 * - Escucha en 0.0.0.0:$PORT (Render inyecta PORT).
 * - Fallback de SPA: las rutas sin extensión devuelven index.html, así
 *   recargar /panel/inventario no da 404.
 * - Archivos con hash (*.js, *.css…) → caché de 1 año; index.html → no-cache.
 * - /healthz → 200 "ok" para el health check de Render.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(fileURLToPath(new URL('.', import.meta.url)), 'dist', 'frontend', 'browser');
const INDEX = join(RAIZ, 'index.html');
const PUERTO = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.webmanifest': 'application/manifest+json',
};

const CABECERAS_SEGURIDAD = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/** Resuelve la ruta pedida dentro de RAIZ; null si intenta salir de ella. */
function rutaSegura(pathname) {
  let decodificada;
  try {
    decodificada = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  const ruta = resolve(RAIZ, '.' + normalize(decodificada));
  return ruta === RAIZ || ruta.startsWith(RAIZ + sep) ? ruta : null;
}

async function esArchivo(ruta) {
  try {
    return (await stat(ruta)).isFile();
  } catch {
    return false;
  }
}

function enviarArchivo(req, res, ruta, cacheLarga) {
  res.writeHead(200, {
    ...CABECERAS_SEGURIDAD,
    'Content-Type': TIPOS[extname(ruta).toLowerCase()] ?? 'application/octet-stream',
    'Cache-Control': cacheLarga ? 'public, max-age=31536000, immutable' : 'no-cache',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(ruta)
    .on('error', () => res.destroy())
    .pipe(res);
}

function responder(res, estado, texto) {
  res.writeHead(estado, { ...CABECERAS_SEGURIDAD, 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(texto);
}

const servidor = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return responder(res, 405, 'Método no permitido');
  }

  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  if (pathname === '/healthz') return responder(res, 200, 'ok');

  const ruta = rutaSegura(pathname);
  if (ruta === null) return responder(res, 400, 'Ruta no válida');

  if (ruta !== RAIZ && (await esArchivo(ruta))) {
    // index.html nunca se cachea; el resto de archivos del build lleva hash.
    return enviarArchivo(req, res, ruta, ruta !== INDEX);
  }

  // Un archivo con extensión que no existe es un 404 real (no se disfraza de index.html).
  if (extname(pathname)) return responder(res, 404, 'Recurso no encontrado');

  // Ruta de la SPA (/, /panel/inventario, /ollas/3…): la resuelve el router de Angular.
  return enviarArchivo(req, res, INDEX, false);
});

servidor.listen(PUERTO, HOST, () => {
  console.log(`AYNI frontend sirviendo ${RAIZ} en http://${HOST}:${PUERTO}`);
});

// Render envía SIGTERM al redesplegar: cerrar limpio.
for (const senal of ['SIGTERM', 'SIGINT']) {
  process.on(senal, () => servidor.close(() => process.exit(0)));
}
