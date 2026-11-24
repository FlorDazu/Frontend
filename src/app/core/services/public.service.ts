import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type { Kpis, OllaPublica, OllaRegistro, RespuestaOllaNueva, Ubigeo } from '../models';

export interface FiltroOllas {
  departamento?: string;
  provincia?: string;
  distrito?: string;
  id_ubigeo?: number;
  atiende_hoy?: boolean;
  recibe_frescos?: boolean;
  q?: string;
}

/** HU-01 a HU-04 · GET/POST /api/public/* (sin autenticación). */
@Injectable({ providedIn: 'root' })
export class PublicService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/public`;

  /** HU-01 · Indicadores de impacto en tiempo real. */
  kpis(): Observable<Kpis> {
    return this.http.get<Kpis>(`${this.base}/kpis`);
  }

  /** HU-02 · Catálogo geográfico (departamento / provincia / distrito). */
  ubigeos(filtro: { departamento?: string; provincia?: string } = {}): Observable<Ubigeo[]> {
    return this.http.get<Ubigeo[]>(`${this.base}/ubigeos`, {
      params: parametros({ departamento: filtro.departamento, provincia: filtro.provincia }),
    });
  }

  /** HU-02/HU-03 · Ollas activas con filtros geográficos. */
  ollas(filtro: FiltroOllas = {}): Observable<OllaPublica[]> {
    return this.http.get<OllaPublica[]>(`${this.base}/ollas`, { params: parametros({ ...filtro }) });
  }

  /** HU-03 · Ficha pública de una olla (404 en español si no existe). */
  olla(idOlla: number): Observable<OllaPublica> {
    return this.http.get<OllaPublica>(`${this.base}/ollas/${idOlla}`);
  }

  /** HU-04 · Registro directo de nueva olla común (sin cuenta). */
  registrar(datos: OllaRegistro): Observable<RespuestaOllaNueva> {
    return this.http.post<RespuestaOllaNueva>(`${this.base}/ollas`, datos);
  }
}
