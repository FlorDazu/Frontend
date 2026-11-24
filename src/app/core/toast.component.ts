import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/** Host global de notificaciones (se monta en el componente raíz). */
@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (toast of toasts.items(); track toast.id) {
        <div [class]="'toast toast-' + toast.tipo">
          <div class="toast-cuerpo">
            <strong>{{ titulos[toast.tipo] }}</strong>
            <span>{{ toast.mensaje }}</span>
          </div>
          <button type="button" class="toast-x" (click)="toasts.quitar(toast.id)" aria-label="Cerrar aviso">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly toasts = inject(ToastService);
  readonly titulos = { exito: 'Listo', error: 'No se pudo completar', info: 'AYNI' };
}
