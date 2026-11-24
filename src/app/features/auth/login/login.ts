import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/error-api';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/toast.service';

/**
 * HU-07 · Inicio de sesión (usuario o correo + contraseña).
 *
 * Envía `application/x-www-form-urlencoded` como especifica el backend;
 * AuthService reintenta en JSON si el servidor responde 422 (ver ahí el
 * detalle), de modo que el login siempre funciona.
 */
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
})
export class Login implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  username = '';
  password = '';
  cargando = signal(false);
  error = signal('');
  sesionExpirada = false;

  ngOnInit(): void {
    this.sesionExpirada = this.ruta.snapshot.queryParamMap.get('expirada') === '1';
    // Si ya hay sesión, no tiene sentido mostrar el formulario.
    if (this.auth.usuario()) {
      this.irAlPanel();
    }
  }

  enviar(): void {
    this.error.set('');

    if (this.username.trim().length < 3) {
      this.error.set('Ingrese su usuario o correo electrónico.');
      return;
    }
    if (!this.password) {
      this.error.set('Ingrese su contraseña.');
      return;
    }

    this.cargando.set(true);
    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: (sesion) => {
        this.cargando.set(false);
        this.toast.exito(sesion.mensaje);
        this.irAlPanel();
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err));
      },
    });
  }

  private irAlPanel(): void {
    const destino = this.ruta.snapshot.queryParamMap.get('returnUrl');
    if (destino && destino.startsWith('/')) {
      this.router.navigateByUrl(destino);
      return;
    }
    this.router.navigate([this.auth.esAdmin() ? '/admin/ollas' : '/panel/mi-olla']);
  }
}
