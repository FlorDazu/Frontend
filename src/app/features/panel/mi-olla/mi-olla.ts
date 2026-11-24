import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fEntero, fFecha, fSiNo } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { OllaResumen } from '../../../core/models';
import { OllaService } from '../../../core/services/olla.service';
import { ToastService } from '../../../core/toast.service';

/** HU-08 · Perfil de "Mi olla" y actualización del estado diario. */
@Component({
  selector: 'app-mi-olla',
  imports: [FormsModule],
  templateUrl: './mi-olla.html',
})
export class MiOlla implements OnInit {
  private readonly ollaService = inject(OllaService);
  private readonly toast = inject(ToastService);

  readonly fEntero = fEntero;
  readonly fFecha = fFecha;
  readonly fSiNo = fSiNo;

  olla = signal<OllaResumen | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');

  // Estado diario (HU-08)
  atiendeHoy = false;
  recibeFrescos = false;
  beneficiarios = 0;
  necesidades = '';

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.ollaService.miOlla().subscribe({
      next: (olla) => {
        this.olla.set(olla);
        this.atiendeHoy = !!olla.atiende_hoy;
        this.recibeFrescos = !!olla.recibe_frescos;
        this.beneficiarios = olla.beneficiarios ?? 0;
        this.necesidades = olla.necesidades_urgentes ?? '';
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  guardarEstado(): void {
    if (this.beneficiarios < 0) {
      this.error.set('La cantidad de beneficiarias(os) no puede ser negativa.');
      return;
    }
    if (this.necesidades.length > 500) {
      this.error.set('Las necesidades urgentes no pueden superar los 500 caracteres.');
      return;
    }

    this.error.set('');
    this.guardando.set(true);
    this.ollaService
      .estadoDiario({
        atiende_hoy: this.atiendeHoy,
        recibe_frescos: this.recibeFrescos,
        beneficiarios: this.beneficiarios,
        necesidades_urgentes: this.necesidades.trim() || null,
      })
      .subscribe({
        next: (respuesta) => {
          this.olla.set(respuesta.olla);
          this.guardando.set(false);
          this.toast.exito(respuesta.mensaje);
        },
        error: (err) => {
          this.guardando.set(false);
          this.error.set(mensajeDeError(err));
        },
      });
  }
}
