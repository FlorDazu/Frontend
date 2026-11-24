import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type { EstadoDiario, OllaResumen, RespuestaOlla } from '../models';

/** HU-08 · Panel de la dirigenta: su olla y estado diario. */
@Injectable({ providedIn: 'root' })
export class OllaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/olla`;

  /** GET /api/olla/mi-olla — la DIRIGENTA siempre ve su propia olla;
   *  un ADMIN puede consultar otra con `id_olla` (HU-14). */
  miOlla(idOlla?: number): Observable<OllaResumen> {
    return this.http.get<OllaResumen>(`${this.base}/mi-olla`, {
      params: parametros({ id_olla: idOlla }),
    });
  }

  /** PUT /api/olla/estado-diario — atención del día, frescos, beneficiarios y necesidades. */
  estadoDiario(datos: EstadoDiario, idOlla?: number): Observable<RespuestaOlla> {
    return this.http.put<RespuestaOlla>(`${this.base}/estado-diario`, datos, {
      params: parametros({ id_olla: idOlla }),
    });
  }
}
