import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type { DespacharReceta, Receta, RespuestaDespacho, RespuestaExternas } from '../models';

/** HU-12 · Recetario local, cálculo proporcional, despacho atómico y recetas externas. */
@Injectable({ providedIn: 'root' })
export class RecetasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/recetas`;

  /** GET /api/recetas?raciones= — ingredientes calculados contra el stock vigente. */
  recetas(raciones?: number, idOlla?: number): Observable<Receta[]> {
    return this.http.get<Receta[]>(this.base, {
      params: parametros({ raciones, id_olla: idOlla }),
    });
  }

  /** POST /api/recetas/despachar — descuenta todo por PEPS o revierte todo. */
  despachar(datos: DespacharReceta, idOlla?: number): Observable<RespuestaDespacho> {
    return this.http.post<RespuestaDespacho>(`${this.base}/despachar`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }

  /** GET /api/recetas/externas?q= — API Ninjas con respaldo local. */
  externas(q: string): Observable<RespuestaExternas> {
    return this.http.get<RespuestaExternas>(`${this.base}/externas`, { params: parametros({ q }) });
  }
}
