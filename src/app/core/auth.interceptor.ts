import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { from, map, of, switchMap, throwError, catchError, type Observable } from 'rxjs';
import { ErrorApi } from './error-api';
import { AuthService } from './services/auth.service';

/**
 * Interceptor funcional (HttpInterceptorFn):
 *  1. Adjunta `Authorization: Bearer <token>` a toda petición autenticada.
 *  2. Captura los 401 para cerrar sesión y volver al login.
 *  3. Traduce el cuerpo `{"detail": "..."}` del backend a un ErrorApi con
 *     el mensaje en español, que las pantallas muestran tal cual.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const peticion = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(peticion).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) {
        return throwError(() => new ErrorApi('Ocurrió un error inesperado de conexión.', 0));
      }
      return mensajeDe(err).pipe(
        switchMap((mensaje) => {
          if (err.status === 401 && token) {
            auth.cerrarSesionLocal();
            router.navigate(['/login'], { queryParams: { expirada: '1' } });
          }
          return throwError(() => new ErrorApi(mensaje, err.status));
        }),
      );
    }),
  );
};

function mensajeDe(err: HttpErrorResponse): Observable<string> {
  if (err.status === 0) {
    return of('No se pudo conectar con el servidor AYNI. Verifique que la API esté en ejecución.');
  }
  if (err.error instanceof Blob) {
    // Descargas CSV: el error llega como Blob, se lee de forma asíncrona.
    return from(err.error.text()).pipe(map((texto) => extraerDetalle(texto) ?? generico(err.status)));
  }
  return of(extraerDetalle(err.error) ?? generico(err.status));
}

function extraerDetalle(cuerpo: unknown): string | null {
  if (cuerpo === null || cuerpo === undefined || cuerpo === '') return null;
  if (typeof cuerpo === 'string') {
    try {
      return extraerDetalle(JSON.parse(cuerpo));
    } catch {
      const texto = cuerpo.trim();
      return texto || null;
    }
  }
  if (typeof cuerpo === 'object' && 'detail' in cuerpo) {
    const detalle = (cuerpo as { detail: unknown }).detail;
    if (typeof detalle === 'string' && detalle.trim()) return detalle.trim();
    if (Array.isArray(detalle)) {
      const mensajes = detalle
        .map((item) => (typeof item === 'object' && item !== null ? String((item as { msg?: unknown }).msg ?? '') : ''))
        .filter((m) => m.trim());
      if (mensajes.length) return mensajes.join(' · ');
    }
  }
  return null;
}

function generico(estado: number): string {
  if (estado === 404) return 'El recurso solicitado no existe o no está disponible.';
  if (estado === 403) return 'No tiene permisos para realizar esta acción.';
  if (estado === 423) return 'La operación está bloqueada temporalmente. Intente más tarde.';
  if (estado >= 500) return 'El servidor encontró un problema. Intente nuevamente en unos minutos.';
  return `El servidor respondió con un error (${estado}). Intente nuevamente.`;
}
