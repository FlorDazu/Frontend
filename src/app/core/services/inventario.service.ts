import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type {
  DescarteLote,
  EntradaInventario,
  Insumo,
  Lote,
  RespuestaConClaves,
  RespuestaSalida,
  RespuestaStock,
  SalidaInventario,
  Semaforo,
} from '../models';

export interface FiltroLotes {
  estado?: 'ACTIVO' | 'AGOTADO' | 'DESCARTADO' | 'TODOS';
  semaforo?: Semaforo;
  id_insumo?: number;
}

/** HU-11 · Inventario PEPS: catálogo, stock, lotes, entradas, salidas y descartes. */
@Injectable({ providedIn: 'root' })
export class InventarioService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  /** GET /api/insumos — catálogo de insumos. */
  insumos(categoria?: string): Observable<Insumo[]> {
    return this.http.get<Insumo[]>(`${this.base}/insumos`, { params: parametros({ categoria }) });
  }

  /** GET /api/inventario/stock — stock consolidado con alertas. */
  stock(soloAlertas = false, idOlla?: number): Observable<RespuestaStock> {
    return this.http.get<RespuestaStock>(`${this.base}/inventario/stock`, {
      params: parametros({ solo_alertas: soloAlertas, id_olla: idOlla }),
    });
  }

  /** GET /api/inventario/lotes — lotes con días para vencer y semáforo (orden PEPS). */
  lotes(filtro: FiltroLotes = {}, idOlla?: number): Observable<Lote[]> {
    return this.http.get<Lote[]>(`${this.base}/inventario/lotes`, {
      params: parametros({ estado: 'ACTIVO', ...filtro, id_olla: idOlla }),
    });
  }

  /** POST /api/inventario/entrada — entrada manual (crea lote). */
  entrada(datos: EntradaInventario, idOlla?: number): Observable<RespuestaConClaves> {
    return this.http.post<RespuestaConClaves>(`${this.base}/inventario/entrada`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }

  /** POST /api/inventario/salida — salida por método PEPS. */
  salida(datos: SalidaInventario, idOlla?: number): Observable<RespuestaSalida> {
    return this.http.post<RespuestaSalida>(`${this.base}/inventario/salida`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }

  /** POST /api/inventario/descartar — descarte/merma con motivo obligatorio. */
  descartar(datos: DescarteLote, idOlla?: number): Observable<RespuestaConClaves> {
    return this.http.post<RespuestaConClaves>(`${this.base}/inventario/descartar`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }
}
