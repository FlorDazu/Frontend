import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fFechaHora } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { UsuarioAdmin } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/toast.service';

/** HU-14 · Gestión de usuarios: rol, estado, edición y desbloqueo. Solo ADMIN. */
@Component({
  selector: 'app-usuarios-admin',
  imports: [FormsModule],
  templateUrl: './usuarios-admin.html',
})
export class UsuariosAdmin implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly fFechaHora = fFechaHora;

  usuarios = signal<UsuarioAdmin[]>([]);
  cargando = signal(false);
  procesando = 0;
  error = signal('');
  errorForm = signal('');

  filtroRol: '' | 'ADMIN' | 'DIRIGENTA' = '';
  filtroActivo: '' | '1' | '0' = '';
  busqueda = '';

  // Edición en línea
  usuarioEditando = 0;
  edicion = { nombre_completo: '', telefono: '' };

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.admin
      .usuarios({
        rol: this.filtroRol || undefined,
        activo: this.filtroActivo === '' ? undefined : this.filtroActivo === '1',
        q: this.busqueda.trim() || undefined,
      })
      .subscribe({
        next: (usuarios) => {
          this.usuarios.set(usuarios);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargando.set(false);
        },
      });
  }

  alternarActivo(usuario: UsuarioAdmin): void {
    const activar = !usuario.activo;
    const confirmacion = window.confirm(
      activar
        ? `¿Activar la cuenta de ${usuario.username}? Podrá iniciar sesión nuevamente.`
        : `¿Desactivar la cuenta de ${usuario.username}? No podrá iniciar sesión hasta que se reactive.`,
    );
    if (!confirmacion) return;

    this.procesando = usuario.id_usuario;
    this.admin.actualizarUsuario(usuario.id_usuario, { activo: activar }).subscribe({
      next: (respuesta) => {
        this.procesando = 0;
        this.toast.exito(respuesta.mensaje);
        this.cargar();
      },
      error: (err) => {
        this.procesando = 0;
        this.toast.error(mensajeDeError(err));
      },
    });
  }

  desbloquear(usuario: UsuarioAdmin): void {
    const confirmacion = window.confirm(
      `¿Desbloquear la cuenta de ${usuario.username}? Se reiniciarán los intentos fallidos.`,
    );
    if (!confirmacion) return;

    this.procesando = usuario.id_usuario;
    this.admin.actualizarUsuario(usuario.id_usuario, { desbloquear: true }).subscribe({
      next: (respuesta) => {
        this.procesando = 0;
        this.toast.exito(respuesta.mensaje);
        this.cargar();
      },
      error: (err) => {
        this.procesando = 0;
        this.toast.error(mensajeDeError(err));
      },
    });
  }

  iniciarEdicion(usuario: UsuarioAdmin): void {
    this.usuarioEditando = usuario.id_usuario;
    this.edicion = { nombre_completo: usuario.nombre_completo, telefono: usuario.telefono };
    this.errorForm.set('');
  }

  cancelarEdicion(): void {
    this.usuarioEditando = 0;
    this.errorForm.set('');
  }

  guardarEdicion(usuario: UsuarioAdmin): void {
    this.errorForm.set('');
    if (this.edicion.nombre_completo.trim().length < 3) {
      this.errorForm.set('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }
    const telefono = this.edicion.telefono.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{6,15}$/.test(telefono)) {
      this.errorForm.set('El teléfono debe contener solo números (entre 6 y 15 dígitos).');
      return;
    }

    this.procesando = usuario.id_usuario;
    this.admin
      .actualizarUsuario(usuario.id_usuario, {
        nombre_completo: this.edicion.nombre_completo.trim(),
        telefono,
      })
      .subscribe({
        next: (respuesta) => {
          this.procesando = 0;
          this.usuarioEditando = 0;
          this.toast.exito(respuesta.mensaje);
          this.cargar();
        },
        error: (err) => {
          this.procesando = 0;
          this.errorForm.set(mensajeDeError(err));
        },
      });
  }
}
