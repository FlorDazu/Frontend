import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fDecimal, fEntero, fFecha, fFechaHora } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { Insumo, Lote, Semaforo, StockInsumo } from '../../../core/models';
import { InventarioService } from '../../../core/services/inventario.service';
import { ToastService } from '../../../core/toast.service';

type Pestana = 'stock' | 'lotes';

/**
 * HU-11 · Inventario PEPS: stock con semáforo, alertas, entradas,
 * salidas PEPS y descartes/mermas con motivo obligatorio.
 */
@Component({
  selector: 'app-inventario',
  imports: [FormsModule],
  templateUrl: './inventario.html',
})
export class Inventario implements OnInit {
  private readonly inventario = inject(InventarioService);
  private readonly toast = inject(ToastService);

  readonly fDecimal = fDecimal;
  readonly fEntero = fEntero;
  readonly fFecha = fFecha;
  readonly fFechaHora = fFechaHora;

  pestana: Pestana = 'stock';

  stock = signal<StockInsumo[]>([]);
  resumen = signal<{ insumos_catalogo: number; insumos_con_stock: number; insumos_stock_bajo: number; insumos_con_vencidos: number } | null>(null);
  lotes = signal<Lote[]>([]);
  insumos = signal<Insumo[]>([]);

  cargandoStock = signal(false);
  cargandoLotes = signal(false);
  error = signal('');

  // Filtros de lotes
  filtroEstado: 'ACTIVO' | 'AGOTADO' | 'DESCARTADO' | 'TODOS' = 'ACTIVO';
  filtroSemaforo: '' | Semaforo = '';

  // Formularios de movimiento
  mostrarEntrada = false;
  mostrarSalida = false;
  entrada = { id_insumo: 0, cantidad: 0, fecha_vencimiento: '', motivo: '' };
  salida = { id_insumo: 0, cantidad: 0, motivo: '' };
  guardando = signal(false);
  errorForm = signal('');

  // Descarte por lote
  loteDescarte = 0;
  motivoDescarte = '';

  ngOnInit(): void {
    this.cargarStock();
    this.cargarLotes();
    this.inventario.insumos().subscribe({
      next: (insumos) => {
        this.insumos.set(insumos);
        if (insumos.length && !this.entrada.id_insumo) {
          this.entrada.id_insumo = insumos[0].id_insumo;
          this.salida.id_insumo = insumos[0].id_insumo;
        }
      },
      error: (err) => this.error.set(mensajeDeError(err)),
    });
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana = pestana;
    if (pestana === 'stock') this.cargarStock();
    else this.cargarLotes();
  }

  cargarStock(): void {
    this.cargandoStock.set(true);
    this.inventario.stock().subscribe({
      next: (respuesta) => {
        this.stock.set(respuesta.insumos);
        this.resumen.set(respuesta.resumen);
        this.cargandoStock.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargandoStock.set(false);
      },
    });
  }

  cargarLotes(): void {
    this.cargandoLotes.set(true);
    this.inventario
      .lotes({
        estado: this.filtroEstado,
        semaforo: this.filtroSemaforo || undefined,
      })
      .subscribe({
        next: (lotes) => {
          this.lotes.set(lotes);
          this.cargandoLotes.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargandoLotes.set(false);
        },
      });
  }

  insumoRequiereVencimiento(idInsumo: number): boolean {
    return !!this.insumos().find((i) => i.id_insumo === idInsumo)?.requiere_vencimiento;
  }

  registrarEntrada(): void {
    this.errorForm.set('');
    if (!this.entrada.id_insumo) {
      this.errorForm.set('Seleccione el insumo de la entrada.');
      return;
    }
    if (!(this.entrada.cantidad > 0)) {
      this.errorForm.set('La cantidad debe ser mayor a cero.');
      return;
    }
    if (this.insumoRequiereVencimiento(this.entrada.id_insumo) && !this.entrada.fecha_vencimiento) {
      this.errorForm.set('El insumo seleccionado requiere fecha de vencimiento.');
      return;
    }

    this.guardando.set(true);
    this.inventario
      .entrada({
        id_insumo: this.entrada.id_insumo,
        cantidad: this.entrada.cantidad,
        fecha_vencimiento: this.entrada.fecha_vencimiento || null,
        motivo: this.entrada.motivo.trim() || null,
      })
      .subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.toast.exito(respuesta.mensaje);
          this.entrada.cantidad = 0;
          this.entrada.fecha_vencimiento = '';
          this.entrada.motivo = '';
          this.mostrarEntrada = false;
          this.cargarStock();
          this.cargarLotes();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorForm.set(mensajeDeError(err));
        },
      });
  }

  registrarSalida(): void {
    this.errorForm.set('');
    if (!this.salida.id_insumo) {
      this.errorForm.set('Seleccione el insumo de la salida.');
      return;
    }
    if (!(this.salida.cantidad > 0)) {
      this.errorForm.set('La cantidad debe ser mayor a cero.');
      return;
    }

    this.guardando.set(true);
    this.inventario
      .salida({
        id_insumo: this.salida.id_insumo,
        cantidad: this.salida.cantidad,
        motivo: this.salida.motivo.trim() || null,
      })
      .subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.toast.exito(respuesta.mensaje);
          this.salida.cantidad = 0;
          this.salida.motivo = '';
          this.mostrarSalida = false;
          this.cargarStock();
          this.cargarLotes();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorForm.set(mensajeDeError(err));
        },
      });
  }

  iniciarDescarte(idLote: number): void {
    this.loteDescarte = idLote;
    this.motivoDescarte = '';
    this.errorForm.set('');
  }

  confirmarDescarte(): void {
    this.errorForm.set('');
    if (this.motivoDescarte.trim().length < 5) {
      this.errorForm.set('Debe indicar el motivo del descarte (mínimo 5 caracteres).');
      return;
    }
    this.guardando.set(true);
    this.inventario.descartar({ id_lote: this.loteDescarte, motivo: this.motivoDescarte.trim() }).subscribe({
      next: (respuesta) => {
        this.guardando.set(false);
        this.toast.exito(respuesta.mensaje);
        this.loteDescarte = 0;
        this.motivoDescarte = '';
        this.cargarStock();
        this.cargarLotes();
      },
      error: (err) => {
        this.guardando.set(false);
        this.errorForm.set(mensajeDeError(err));
      },
    });
  }

  cancelarDescarte(): void {
    this.loteDescarte = 0;
    this.motivoDescarte = '';
  }

  claseSemaforo(semaforo: Semaforo): string {
    return semaforo === 'VIGENTE' ? 'chip-verde' : semaforo === 'POR_VENCER' ? 'chip-ambar' : 'chip-rojo';
  }

  claseStock(stock: StockInsumo): string {
    if (stock.stock_actual <= 0) return 'chip-rojo';
    if (stock.alerta_stock_bajo) return 'chip-ambar';
    return 'chip-verde';
  }

  textoStock(stock: StockInsumo): string {
    if (stock.stock_actual <= 0) return 'Agotado';
    if (stock.alerta_stock_bajo) return `Stock bajo · falta ${fDecimal(stock.faltante_para_minimo)}`;
    return 'Stock suficiente';
  }
}
