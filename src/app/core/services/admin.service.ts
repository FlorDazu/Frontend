import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parametros } from '../params';
import type {
  OllaAdmin,
  RespuestaOllaAdmin,
  RespuestaUsuario,
  UsuarioAdmin,
  UsuarioAdminUpdate,
} from '../models';

export interface FiltroOllasAdmin {
  activada?: boolean;
  q?: string;
}

export interface FiltroUsuarios {
  rol?: string;
  activo?: boolean;
  q?: string;
}

/** HU-14 · Gestión total del administrador (ollas y usuarios). Solo ADMIN. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  /** GET /api/admin/ollas — todas las ollas (activas e inactivas). */
  ollas(filtro: FiltroOllasAdmin = {}): Observable<OllaAdmin[]> {
    return this.http.get<OllaAdmin[]>(`${this.base}/ollas`, { params: parametros({ ...filtro }) });
  }

  /** PATCH /api/admin/ollas/{id}/estado — activar / desactivar. */
  cambiarEstadoOlla(idOlla: number, activada: boolean): Observable<RespuestaOllaAdmin> {
    return this.http.patch<RespuestaOllaAdmin>(`${this.base}/ollas/${idOlla}/estado`, { activada });
  }

  /** GET /api/admin/usuarios — con rol, estado y bloqueo. */
  usuarios(filtro: FiltroUsuarios = {}): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${this.base}/usuarios`, { params: parametros({ ...filtro }) });
  }

  /** PATCH /api/admin/usuarios/{id} — activar/desactivar, editar o desbloquear. */
  actualizarUsuario(idUsuario: number, datos: UsuarioAdminUpdate): Observable<RespuestaUsuario> {
    return this.http.patch<RespuestaUsuario>(`${this.base}/usuarios/${idUsuario}`, datos);
  }
}
