import { Component, inject } from '@angular/core';
import { TAMANOS_LETRA, TamanoLetraService } from './tamano-letra.service';

/**
 * Selector visual `A− | A+` de la cabecera pública.
 * Redimensiona la fuente raíz del documento y anuncia el cambio a los
 * lectores de pantalla mediante una región viva.
 */
@Component({
  selector: 'app-tamano-letra',
  template: `
    <div class="control-letra" role="group" aria-label="Tamaño de letra">
      <button
        type="button"
        class="btn-letra"
        [disabled]="letra.indice() === 0"
        (click)="letra.disminuir()"
        aria-label="Reducir el tamaño de letra"
        title="Reducir el tamaño de letra"
      >
        A&minus;
      </button>
      <button
        type="button"
        class="btn-letra"
        [disabled]="letra.indice() === letra.total - 1"
        (click)="letra.aumentar()"
        aria-label="Aumentar el tamaño de letra"
        title="Aumentar el tamaño de letra"
      >
        A+
      </button>
      <span class="sr-only" aria-live="polite">{{ estado() }}</span>
    </div>
  `,
})
export class TamanoLetraComponent {
  readonly letra = inject(TamanoLetraService);

  estado(): string {
    const porcentaje = Math.round((TAMANOS_LETRA[this.letra.indice()] / TAMANOS_LETRA[0]) * 100);
    return `Tamaño de letra ajustado a ${porcentaje} por ciento.`;
  }
}
