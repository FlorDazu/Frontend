import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fDecimal, fEntero } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { Receta, RecetaExterna } from '../../../core/models';
import { RecetasService } from '../../../core/services/recetas.service';
import { ToastService } from '../../../core/toast.service';

/**
 * HU-12 · Recetario local con cálculo proporcional por raciones, despacho
 * atómico (todo o nada por PEPS) y búsqueda de recetas externas.
 */
@Component({
  selector: 'app-recetas',
  imports: [FormsModule],
  templateUrl: './recetas.html',
})
export class Recetas implements OnInit {
  private readonly recetasService = inject(RecetasService);
  private readonly toast = inject(ToastService);

  readonly fDecimal = fDecimal;
  readonly fEntero = fEntero;

  recetas = signal<Receta[]>([]);
  cargando = signal(true);
  error = signal('');
  despachando = signal(false);

  raciones = 50;

  // Recetas externas
  consulta = '';
  buscandoExterna = signal(false);
  externas = signal<RecetaExterna[] | null>(null);
  avisoExterno = signal('');
  fuenteExterna = signal('');
  errorExterno = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    const raciones = this.raciones > 0 ? this.raciones : undefined;
    this.recetasService.recetas(raciones).subscribe({
      next: (recetas) => {
        this.recetas.set(recetas);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  despachar(receta: Receta): void {
    const raciones = this.raciones > 0 ? this.raciones : receta.raciones_base;
    const confirmacion = window.confirm(
      `¿Despachar ${raciones} ración(es) de «${receta.nombre}»? ` +
        'Los ingredientes se descontarán del almacén por PEPS; si falta stock no se descontará nada.',
    );
    if (!confirmacion) return;

    this.despachando.set(true);
    this.recetasService.despachar({ id_receta: receta.id_receta, raciones }).subscribe({
      next: (respuesta) => {
        this.despachando.set(false);
        this.toast.exito(respuesta.mensaje);
        this.cargar();
      },
      error: (err) => {
        this.despachando.set(false);
        this.toast.error(mensajeDeError(err));
      },
    });
  }

  buscarExternas(): void {
    const q = this.consulta.trim();
    if (q.length < 2) {
      this.errorExterno.set('Ingrese al menos 2 caracteres (ej.: lentejas, pollo, arroz).');
      return;
    }
    this.errorExterno.set('');
    this.buscandoExterna.set(true);
    this.recetasService.externas(q).subscribe({
      next: (respuesta) => {
        this.buscandoExterna.set(false);
        this.externas.set(respuesta.recetas);
        this.avisoExterno.set(respuesta.aviso ?? '');
        this.fuenteExterna.set(respuesta.fuente === 'API Ninjas' ? 'API Ninjas' : 'Recetario local de respaldo');
      },
      error: (err) => {
        this.buscandoExterna.set(false);
        this.errorExterno.set(mensajeDeError(err));
      },
    });
  }

  cerrarExternas(): void {
    this.externas.set(null);
    this.consulta = '';
    this.avisoExterno.set('');
    this.fuenteExterna.set('');
    this.errorExterno.set('');
  }

  clavesNutricion(nutricion: Record<string, unknown> | string | null): { clave: string; valor: string }[] {
    if (!nutricion || typeof nutricion !== 'object') return [];
    return Object.entries(nutricion).map(([clave, valor]) => ({
      clave,
      valor: String(valor),
    }));
  }
}
