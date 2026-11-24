import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fDecimal, fEntero, fFechaHora, fSoles, fSiNo } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { Movimiento, OllaAdmin, ResumenReporte, StockInsumo } from '../../../core/models';
import { AdminService } from '../../../core/services/admin.service';
import { ReportesService } from '../../../core/services/reportes.service';

/**
 * HU-14 · Auditoría de una olla concreta para el ADMIN, controlada por la
 * query string `?id_olla=N` (los endpoints de datos aceptan `id_olla` para
 * administradores; las DIRIGENTAs siempre ven la suya propia).
 */
@Component({
  selector: 'app-auditoria',
  imports: [FormsModule],
  templateUrl: './auditoria.html',
})
export class Auditoria implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly reportes = inject(ReportesService);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly fDecimal = fDecimal;
  readonly fEntero = fEntero;
  readonly fFechaHora = fFechaHora;
  readonly fSoles = fSoles;
  readonly fSiNo = fSiNo;

  ollas = signal<OllaAdmin[]>([]);
  idOlla = signal<number | null>(null);
  ollaSel = '';

  resumen = signal<ResumenReporte | null>(null);
  movimientos = signal<Movimiento[]>([]);

  /** El stock detallado viene en el propio resumen (mismo SQL que /api/inventario/stock). */
  get stock(): StockInsumo[] {
    return this.resumen()?.stock ?? [];
  }

  cargando = signal(false);
  error = signal('');

  filtroMov = { tipo: '', fecha_desde: '', fecha_hasta: '' };
  filtroResumen = { fecha_desde: '', fecha_hasta: '' };

  ngOnInit(): void {
    this.admin.ollas().subscribe({
      next: (ollas) => this.ollas.set(ollas),
      error: (err) => this.error.set(mensajeDeError(err)),
    });

    this.ruta.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id_olla'));
      if (Number.isFinite(id) && id > 0) {
        this.idOlla.set(id);
        this.cargarTodo();
      } else {
        this.idOlla.set(null);
        this.resumen.set(null);
        this.movimientos.set([]);
      }
    });
  }

  seleccionar(): void {
    if (!this.ollaSel) {
      this.error.set('Seleccione una olla para ver su auditoría.');
      return;
    }
    this.error.set('');
    this.router.navigate([], { queryParams: { id_olla: this.ollaSel } });
  }

  cambiarDeOlla(): void {
    this.error.set('');
    this.router.navigate([], { queryParams: {} });
  }

  cargarTodo(): void {
    this.cargarResumen();
    this.cargarMovimientos();
  }

  cargarResumen(): void {
    const id = this.idOlla();
    if (!id) return;
    this.cargando.set(true);
    this.reportes
      .resumen({
        fecha_desde: this.filtroResumen.fecha_desde || undefined,
        fecha_hasta: this.filtroResumen.fecha_hasta || undefined,
      }, id)
      .subscribe({
        next: (resumen) => {
          this.resumen.set(resumen);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargando.set(false);
        },
      });
  }

  cargarMovimientos(): void {
    const id = this.idOlla();
    if (!id) return;
    this.cargando.set(true);
    this.reportes
      .movimientos({
        tipo: (this.filtroMov.tipo || undefined) as Movimiento['tipo_movimiento'] | undefined,
        fecha_desde: this.filtroMov.fecha_desde || undefined,
        fecha_hasta: this.filtroMov.fecha_hasta || undefined,
        limite: 200,
      }, id)
      .subscribe({
        next: (movimientos) => {
          this.movimientos.set(movimientos);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargando.set(false);
        },
      });
  }

  claseTipo(tipo: Movimiento['tipo_movimiento']): string {
    return tipo === 'ENTRADA' ? 'chip-verde' : tipo === 'SALIDA' ? 'chip-ambar' : 'chip-rojo';
  }

  claseStock(item: StockInsumo): string {
    if (item.stock_actual <= 0) return 'chip-rojo';
    if (item.alerta_stock_bajo) return 'chip-ambar';
    return 'chip-verde';
  }
}
