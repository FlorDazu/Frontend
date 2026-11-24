import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type { DescargaCsv, Movimiento, ResumenReporte, TipoMovimiento } from '../models';

export interface FiltroMovimientos {
  tipo?: TipoMovimiento;
  id_insumo?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  limite?: number;
}

export interface FiltroRango {
  fecha_desde?: string;
  fecha_hasta?: string;
}

export type TipoCsv = 'movimientos' | 'stock' | 'donaciones';

/** HU-14 · Kardex correlativo, reporte consolidado y exportación CSV. */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  /** GET /api/movimientos — kardex (#E-, #S-, #D-). */
  movimientos(filtro: FiltroMovimientos = {}, idOlla?: number): Observable<Movimiento[]> {
    return this.http.get<Movimiento[]>(`${this.base}/movimientos`, {
      params: parametros({ limite: 200, ...filtro, id_olla: idOlla }),
    });
  }

  /** GET /api/reportes/resumen — reporte consolidado en JSON. */
  resumen(filtro: FiltroRango = {}, idOlla?: number): Observable<ResumenReporte> {
    return this.http.get<ResumenReporte>(`${this.base}/reportes/resumen`, {
      params: parametros({ ...filtro, id_olla: idOlla }),
    });
  }

  /**
   * GET /api/reportes/exportar-csv — descarga el archivo (el backend expone
   * `Content-Disposition` vía CORS para leer el nombre sugerido).
   */
  exportarCsv(tipo: TipoCsv, filtro: FiltroRango = {}, idOlla?: number): Observable<DescargaCsv> {
    return this.http
      .get(`${environment.apiUrl}/reportes/exportar-csv`, {
        params: parametros({ tipo, ...filtro, id_olla: idOlla }),
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((respuesta) => {
          const cabecera = respuesta.headers.get('Content-Disposition') ?? '';
          const coincidencia = /filename="?([^";]+)"?/.exec(cabecera);
          return {
            blob: respuesta.body ?? new Blob(),
            nombre: coincidencia?.[1] ?? `ayni_${tipo}.csv`,
          };
        }),
      );
  }
}
