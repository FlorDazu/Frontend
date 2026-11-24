import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, of, tap, throwError, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorApi } from '../error-api';
import type { LoginDatos, Perfil, RegistroCuentaDatos, Sesion } from '../models';

const LLAVE_TOKEN = 'ayni_token';
const LLAVE_USUARIO = 'ayni_usuario';

/** Lee el usuario en cache de forma tolerante a datos corruptos. */
function leerUsuario(): Perfil | null {
  try {
    const crudo = localStorage.getItem(LLAVE_USUARIO);
    return crudo ? (JSON.parse(crudo) as Perfil) : null;
  } catch {
    return null;
  }
}

/**
 * Sesión JWT: token en localStorage, usuario actual (`GET /api/auth/me`)
 * y roles DIRIGENTA / ADMIN.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly token = signal<string | null>(localStorage.getItem(LLAVE_TOKEN));
  readonly usuario = signal<Perfil | null>(leerUsuario());
  /** true mientras se restaura la sesión en el arranque (APP_INITIALIZER). */
  readonly cargando = signal(true);

  readonly autenticado = computed(() => this.usuario() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');
  readonly nombreRol = computed(() => (this.usuario()?.rol === 'ADMIN' ? 'Administrador' : 'Dirigenta'));

  /**
   * HU-07 · Inicio de sesión.
   *
   * Se envía primero `application/x-www-form-urlencoded` (username/password)
   * como pide la especificación. El backend actual valida `LoginRequest` como
   * cuerpo JSON y responde 422 al form-data, por lo que ante ese 422 se
   * reintenta automáticamente en JSON: así el login funciona con cualquiera
   * de los dos formatos.
   */
  login(datos: LoginDatos): Observable<Sesion> {
    const cuerpo = new URLSearchParams();
    cuerpo.set('username', datos.username);
    cuerpo.set('password', datos.password);

    return this.http
      .post<Sesion>(`${environment.apiUrl}/auth/login`, cuerpo.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      .pipe(
        catchError((err) => {
          if (err instanceof ErrorApi && err.estado === 422) {
            return this.http.post<Sesion>(`${environment.apiUrl}/auth/login`, datos);
          }
          return throwError(() => err);
        }),
        tap((sesion) => this.guardarSesion(sesion)),
      );
  }

  /** HU-06 · Cuenta de dirigenta + olla en un solo paso (auto-login). */
  registro(datos: RegistroCuentaDatos): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${environment.apiUrl}/auth/registro-olla`, datos)
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  /** HU-07 · Perfil vigente (GET /api/auth/me). */
  perfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${environment.apiUrl}/auth/me`);
  }

  /**
   * Restaura la sesión al arrancar la aplicación. Nunca falla: si el token
   * ya no es válido se limpia la sesión y la app continúa desautenticada.
   */
  restaurarSesion(): Observable<void> {
    if (!this.token()) {
      this.cargando.set(false);
      return of(undefined);
    }
    return this.perfil().pipe(
      map((perfil) => this.usuario.set(perfil)),
      catchError(() => {
        this.limpiar();
        return of(undefined);
      }),
      finalize(() => this.cargando.set(false)),
    );
  }

  /** Cierra la sesión y vuelve al portal público. */
  salir(): void {
    this.limpiar();
    this.router.navigate(['/']);
  }

  /** Uso interno del interceptor ante un 401: limpia sin navegar. */
  cerrarSesionLocal(): void {
    this.limpiar();
  }

  private guardarSesion(sesion: Sesion): void {
    // La respuesta de login trae `olla` en la raíz: se fusiona en el perfil
    // para que la vista coincida con GET /api/auth/me.
    const perfil: Perfil = { ...sesion.usuario, activo: true, olla: sesion.olla };
    localStorage.setItem(LLAVE_TOKEN, sesion.access_token);
    localStorage.setItem(LLAVE_USUARIO, JSON.stringify(perfil));
    this.token.set(sesion.access_token);
    this.usuario.set(perfil);
  }

  private limpiar(): void {
    localStorage.removeItem(LLAVE_TOKEN);
    localStorage.removeItem(LLAVE_USUARIO);
    this.token.set(null);
    this.usuario.set(null);
  }
}
