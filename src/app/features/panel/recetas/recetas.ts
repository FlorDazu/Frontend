import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fDecimal, fEntero } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { Receta, RecetaExterna } from '../../../core/models';
import { RecetasService } from '../../../core/services/recetas.service';
import { ToastService } from '../../../core/toast.service';

const LLAVE_RECETA_DIA = 'ayni_receta_del_dia';

/** Fecha local AAAA-MM-DD (la receta del día cambia a medianoche). */
function hoy(): string {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
}

/** Número estable a partir de un texto: el mismo día siempre da la misma receta. */
function semilla(texto: string): number {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * HU-12 · Receta del día (una sola, elegida según la fecha, con botón para
 * cambiarla), cálculo proporcional por raciones, despacho atómico (todo o nada
 * por PEPS) y búsqueda de recetas externas.
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

  /** Receta elegida manualmente con «Otra receta» (se recuerda solo durante el día). */
  private readonly idElegida = signal<number | null>(this.leerEleccion());

  /** La receta que se muestra hoy: la elegida o la que corresponde a la fecha. */
  readonly recetaDelDia = computed<Receta | null>(() => {
    const lista = this.recetas();
    if (lista.length === 0) return null;
    const elegida = lista.find((r) => r.id_receta === this.idElegida());
    if (elegida) return elegida;
    const ordenadas = [...lista].sort((a, b) => a.id_receta - b.id_receta);
    return ordenadas[semilla(hoy()) % ordenadas.length];
  });

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

  /** Muestra otra receta al azar (distinta de la actual) y la recuerda hasta medianoche. */
  otraReceta(): void {
    const lista = this.recetas();
    const actual = this.recetaDelDia();
    const opciones = lista.filter((r) => r.id_receta !== actual?.id_receta);
    if (opciones.length === 0) return;
    const nueva = opciones[Math.floor(Math.random() * opciones.length)];
    this.idElegida.set(nueva.id_receta);
    try {
      localStorage.setItem(LLAVE_RECETA_DIA, JSON.stringify({ fecha: hoy(), id: nueva.id_receta }));
    } catch {
      /* almacenamiento no disponible: la elección dura solo mientras la vista esté abierta */
    }
  }

  private leerEleccion(): number | null {
    try {
      const guardada = JSON.parse(localStorage.getItem(LLAVE_RECETA_DIA) ?? 'null') as { fecha?: string; id?: number } | null;
      return guardada?.fecha === hoy() && typeof guardada.id === 'number' ? guardada.id : null;
    } catch {
      return null;
    }
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
