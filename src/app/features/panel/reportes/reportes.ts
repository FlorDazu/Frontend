import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fDecimal, fEntero, fFechaHora, fSoles } from '../../../core/formato';
import { ErrorApi, mensajeDeError } from '../../../core/error-api';
import type { Movimiento, ResumenReporte } from '../../../core/models';
import { ReportesService, type TipoCsv } from '../../../core/services/reportes.service';
import { ToastService } from '../../../core/toast.service';

type Pestana = 'kardex' | 'resumen' | 'csv';

/** HU-14 · Kardex de movimientos, reporte consolidado y exportación CSV. */
@Component({
  selector: 'app-reportes',
  imports: [FormsModule],
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  private readonly reportes = inject(ReportesService);
  private readonly toast = inject(ToastService);

  readonly fDecimal = fDecimal;
  readonly fEntero = fEntero;
  readonly fFechaHora = fFechaHora;
  readonly fSoles = fSoles;

  pestana: Pestana = 'kardex';

  // Kardex
  movimientos = signal<Movimiento[]>([]);
  cargandoKardex = signal(false);
  filtroKardex = { tipo: '', fecha_desde: '', fecha_hasta: '', limite: 100 };

  // Resumen
  resumen = signal<ResumenReporte | null>(null);
  cargandoResumen = signal(false);
  filtroResumen = { fecha_desde: '', fecha_hasta: '' };

  // CSV
  csvTipo: TipoCsv = 'movimientos';
  filtroCsv = { fecha_desde: '', fecha_hasta: '' };
  descargando = signal(false);

  error = signal('');

  ngOnInit(): void {
    this.cargarKardex();
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana = pestana;
    if (pestana === 'kardex') this.cargarKardex();
    if (pestana === 'resumen' && !this.resumen()) this.cargarResumen();
  }

  cargarKardex(): void {
    this.cargandoKardex.set(true);
    this.error.set('');
    this.reportes
      .movimientos({
        tipo: (this.filtroKardex.tipo || undefined) as Movimiento['tipo_movimiento'] | undefined,
        fecha_desde: this.filtroKardex.fecha_desde || undefined,
        fecha_hasta: this.filtroKardex.fecha_hasta || undefined,
        limite: this.filtroKardex.limite > 0 ? this.filtroKardex.limite : undefined,
      })
      .subscribe({
        next: (movimientos) => {
          this.movimientos.set(movimientos);
          this.cargandoKardex.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargandoKardex.set(false);
        },
      });
  }

  cargarResumen(): void {
    this.cargandoResumen.set(true);
    this.error.set('');
    this.reportes
      .resumen({
        fecha_desde: this.filtroResumen.fecha_desde || undefined,
        fecha_hasta: this.filtroResumen.fecha_hasta || undefined,
      })
      .subscribe({
        next: (resumen) => {
          this.resumen.set(resumen);
          this.cargandoResumen.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargandoResumen.set(false);
        },
      });
  }

  descargarCsv(): void {
    this.descargando.set(true);
    this.error.set('');
    this.reportes
      .exportarCsv(this.csvTipo, {
        fecha_desde: this.filtroCsv.fecha_desde || undefined,
        fecha_hasta: this.filtroCsv.fecha_hasta || undefined,
      })
      .subscribe({
        next: ({ blob, nombre }) => {
          this.descargando.set(false);
          const url = URL.createObjectURL(blob);
          const enlace = document.createElement('a');
          enlace.href = url;
          enlace.download = nombre;
          document.body.appendChild(enlace);
          enlace.click();
          enlace.remove();
          URL.revokeObjectURL(url);
          this.toast.exito(`Archivo «${nombre}» descargado correctamente.`);
        },
        error: (err) => {
          this.descargando.set(false);
          const mensaje =
            err instanceof ErrorApi && err.estado === 401
              ? 'Su sesión expiró. Vuelva a iniciar sesión para descargar el reporte.'
              : mensajeDeError(err);
          this.toast.error(mensaje);
        },
      });
  }

  claseTipo(tipo: Movimiento['tipo_movimiento']): string {
    return tipo === 'ENTRADA' ? 'chip-verde' : tipo === 'SALIDA' ? 'chip-ambar' : 'chip-rojo';
  }
}
