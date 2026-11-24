import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/error-api';
import type { Ubigeo } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PublicService } from '../../../core/services/public.service';
import { ToastService } from '../../../core/toast.service';

/**
 * HU-06 · Cuenta de dirigenta + olla común en un solo paso
 * (POST /api/auth/registro-olla) con inicio de sesión automático.
 */
@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class Registro implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly publico = inject(PublicService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private ubigeos: Ubigeo[] = [];
  departamentos: string[] = [];
  provincias: string[] = [];
  distritos: Ubigeo[] = [];

  departamentoSel = '';
  provinciaSel = '';
  distritoSel = '';

  nombreCompleto = '';
  username = '';
  telefono = '';
  password = '';
  password2 = '';
  nombreOlla = '';
  direccion = '';
  referencia = '';

  cargando = signal(false);
  error = signal('');

  ngOnInit(): void {
    if (this.auth.usuario()) {
      this.router.navigate([this.auth.esAdmin() ? '/admin/ollas' : '/panel/mi-olla']);
      return;
    }
    this.publico.ubigeos().subscribe({
      next: (ubigeos) => {
        this.ubigeos = ubigeos;
        this.departamentos = [...new Set(ubigeos.map((u) => u.departamento))].sort((a, b) =>
          a.localeCompare(b, 'es'),
        );
      },
      error: (err) => this.error.set(mensajeDeError(err)),
    });
  }

  alCambiarDepartamento(): void {
    this.provinciaSel = '';
    this.distritoSel = '';
    this.provincias = [...new Set(
      this.ubigeos.filter((u) => u.departamento === this.departamentoSel).map((u) => u.provincia),
    )].sort((a, b) => a.localeCompare(b, 'es'));
    this.distritos = [];
  }

  alCambiarProvincia(): void {
    this.distritoSel = '';
    this.distritos = this.ubigeos.filter(
      (u) => u.departamento === this.departamentoSel && u.provincia === this.provinciaSel,
    );
  }

  enviar(): void {
    this.error.set('');

    // Validaciones espejo de backend/app/schemas.py (mensajes en español).
    if (this.nombreCompleto.trim().length < 3) {
      this.error.set('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }
    const usuario = this.username.trim().toLowerCase();
    if (usuario.length < 3 || usuario.includes(' ')) {
      this.error.set('El usuario o correo no debe contener espacios y debe tener al menos 3 caracteres.');
      return;
    }
    if (usuario.includes('@') && !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(usuario)) {
      this.error.set('El correo electrónico no tiene un formato válido (ejemplo: nombre@correo.com).');
      return;
    }
    const telefono = this.telefono.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{6,15}$/.test(telefono)) {
      this.error.set('El teléfono debe contener solo números (entre 6 y 15 dígitos), por ejemplo 987654321.');
      return;
    }
    if (this.password.length < 8 || !/[A-Za-z]/.test(this.password) || !/\d/.test(this.password)) {
      this.error.set('La contraseña debe tener al menos 8 caracteres e incluir letras y números.');
      return;
    }
    if (this.password !== this.password2) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    if (this.nombreOlla.trim().length < 3) {
      this.error.set('El nombre de la olla debe tener al menos 3 caracteres.');
      return;
    }
    if (!this.distritoSel) {
      this.error.set('Seleccione departamento, provincia y distrito de la olla.');
      return;
    }
    if (this.direccion.trim().length < 5) {
      this.error.set('La dirección de la olla debe tener al menos 5 caracteres.');
      return;
    }

    this.cargando.set(true);
    this.auth
      .registro({
        nombre_completo: this.nombreCompleto.trim(),
        username: usuario,
        telefono,
        password: this.password,
        nombre_olla: this.nombreOlla.trim(),
        id_ubigeo: Number(this.distritoSel),
        direccion: this.direccion.trim(),
        referencia: this.referencia.trim() || null,
      })
      .subscribe({
        next: (sesion) => {
          this.cargando.set(false);
          this.toast.exito(sesion.mensaje);
          this.router.navigate(['/panel/mi-olla']);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err));
        },
      });
  }
}
