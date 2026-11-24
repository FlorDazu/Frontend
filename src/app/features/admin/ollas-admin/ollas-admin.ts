import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fEntero, fFechaHora, fSiNo } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { OllaAdmin } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/toast.service';

/** HU-14 · Gestión global de ollas: activar / desactivar. Solo ADMIN. */
@Component({
  selector: 'app-ollas-admin',
  imports: [FormsModule],
  templateUrl: './ollas-admin.html',
})
export class OllasAdmin implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly fEntero = fEntero;
  readonly fFechaHora = fFechaHora;
  readonly fSiNo = fSiNo;

  ollas = signal<OllaAdmin[]>([]);
  cargando = signal(false);
  procesando = 0;
  error = signal('');

  filtroActivada: '' | '1' | '0' = '';
  busqueda = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.admin
      .ollas({
        activada: this.filtroActivada === '' ? undefined : this.filtroActivada === '1',
        q: this.busqueda.trim() || undefined,
      })
      .subscribe({
        next: (ollas) => {
          this.ollas.set(ollas);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargando.set(false);
        },
      });
  }

  cambiarEstado(olla: OllaAdmin): void {
    const activar = !olla.activada;
    const confirmacion = window.confirm(
      activar
        ? `¿Activar la olla ${olla.codigo_unico}? Volverá a ser visible en el portal y sus usuarias podrán ingresar.`
        : `¿Desactivar la olla ${olla.codigo_unico}? Dejará de ser visible y sus usuarias no podrán ingresar.`,
    );
    if (!confirmacion) return;

    this.procesando = olla.id_olla;
    this.admin.cambiarEstadoOlla(olla.id_olla, activar).subscribe({
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
}
