import { Injectable, signal } from '@angular/core';

const LLAVE = 'ayni_tamano_letra';

/** Tamaños de fuente raíz permitidos, en píxeles (de menor a mayor). */
export const TAMANOS_LETRA = [15, 16, 18, 20] as const;

/**
 * Control de tamaño de letra global (accesibilidad WCAG 2.1).
 *
 * Escribe `document.documentElement.style.fontSize` y guarda la preferencia
 * en `localStorage` para que toda la aplicación escale entre visitas.
 * Como casi toda la tipografía del proyecto está en `rem`, el cambio se
 * propaga a todo el sitio sin tocar cada componente.
 */
@Injectable({ providedIn: 'root' })
export class TamanoLetraService {
  /** Índice dentro de `TAMANOS_LETRA` (0 = 15px, el valor por defecto). */
  readonly indice = signal(0);

  constructor() {
    const guardado = Number(localStorage.getItem(LLAVE));
    const encontrador = TAMANOS_LETRA.findIndex((t) => t === guardado);
    this.indice.set(encontrador >= 0 ? encontrador : 0);
    this.aplicar();
  }

  /** Niveles disponibles (para el paginado de los botones). */
  get total(): number {
    return TAMANOS_LETRA.length;
  }

  aumentar(): void {
    if (this.indice() >= TAMANOS_LETRA.length - 1) return;
    this.indice.update((i) => i + 1);
    this.aplicar();
  }

  disminuir(): void {
    if (this.indice() <= 0) return;
    this.indice.update((i) => i - 1);
    this.aplicar();
  }

  private aplicar(): void {
    const px = TAMANOS_LETRA[this.indice()];
    document.documentElement.style.fontSize = `${px}px`;
    try {
      localStorage.setItem(LLAVE, String(px));
    } catch {
      /* modo privado: se aplica igual en esta sesión */
    }
  }
}
