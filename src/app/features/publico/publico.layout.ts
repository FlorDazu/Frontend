import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TamanoLetraComponent } from '../../core/tamano-letra.component';

/** Envoltorio del portal público: cabecera, contenido y pie. */
@Component({
  selector: 'app-publico-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TamanoLetraComponent],
  templateUrl: './publico.layout.html',
})
export class PublicoLayout {
  readonly auth = inject(AuthService);

  /** Año de la barra inferior del pie. */
  readonly anio = new Date().getFullYear();

  /** Menú hamburguesa del portal en pantallas pequeñas. */
  readonly menuAbierto = signal(false);

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
