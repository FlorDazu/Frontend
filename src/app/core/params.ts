import { HttpParams } from '@angular/common/http';

/**
 * Construye HttpParams omitiendo los vacíos (undefined / null / ''),
 * permitiendo números y booleanos (`false` sí se envía).
 */
export function parametros(valores: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === undefined || valor === null || valor === '') continue;
    params = params.set(clave, String(valor));
  }
  return params;
}
