import { Injectable, signal } from '@angular/core';

export type TipoToast = 'exito' | 'error' | 'info';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

/** Notificaciones flotantes para el feedback de formularios (HU-05 / HU-13). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private secuencia = 0;
  readonly items = signal<Toast[]>([]);

  mostrar(mensaje: string, tipo: TipoToast = 'info', milisegundos = 5000): void {
    const id = ++this.secuencia;
    this.items.update((lista) => [...lista, { id, mensaje, tipo }]);
    setTimeout(() => this.quitar(id), milisegundos);
  }

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }

  error(mensaje: string): void {
    this.mostrar(mensaje, 'error', 7000);
  }

  info(mensaje: string): void {
    this.mostrar(mensaje, 'info');
  }

  quitar(id: number): void {
    this.items.update((lista) => lista.filter((t) => t.id !== id));
  }
}
