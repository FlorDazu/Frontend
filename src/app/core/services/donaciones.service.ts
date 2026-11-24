import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type {
  Donacion,
  DonacionCrear,
  Donante,
  DonanteCrear,
  RespuestaDonacion,
  RespuestaDonante,
  TipoDonacion,
  TipoDonante,
} from '../models';

export interface FiltroDonantes {
  tipo_donante?: TipoDonante;
  es_frecuente?: boolean;
  q?: string;
}

export interface FiltroDonaciones {
  tipo_donacion?: TipoDonacion;
  id_donante?: number;
}

/** HU-09 / HU-10 · Donantes y donaciones de la olla. */
@Injectable({ providedIn: 'root' })
export class DonacionesService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}`;

  /** GET /api/donantes */
  donantes(filtro: FiltroDonantes = {}, idOlla?: number): Observable<Donante[]> {
    return this.http.get<Donante[]>(`${this.base}/donantes`, {
      params: parametros({ ...filtro, id_olla: idOlla }),
    });
  }

  /** POST /api/donantes */
  crearDonante(datos: DonanteCrear, idOlla?: number): Observable<RespuestaDonante> {
    return this.http.post<RespuestaDonante>(`${this.base}/donantes`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }

  /** GET /api/donaciones — con los lotes generados por cada donación en especie. */
  donaciones(filtro: FiltroDonaciones = {}, idOlla?: number): Observable<Donacion[]> {
    return this.http.get<Donacion[]>(`${this.base}/donaciones`, {
      params: parametros({ ...filtro, id_olla: idOlla }),
    });
  }

  /** POST /api/donaciones — monetaria (monto) o en especie (items → lotes PEPS). */
  crearDonacion(datos: DonacionCrear, idOlla?: number): Observable<RespuestaDonacion> {
    return this.http.post<RespuestaDonacion>(`${this.base}/donaciones`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }
}
