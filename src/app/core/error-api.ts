/**
 * Error de API con mensaje ya traducido al español (extraído del campo
 * `detail` que devuelve el backend, ver backend/app/main.py).
 */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    readonly estado: number,
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

/** Obtiene el mensaje legible de un error capturado por el interceptor. */
export function mensajeDeError(err: unknown, respaldo = 'Ocurrió un error inesperado. Intente nuevamente.'): string {
  return err instanceof Error && err.message ? err.message : respaldo;
}
