import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface EnlacePanel {
  ruta: string;
  texto: string;
}

/**
 * Envoltorio de los paneles privado. Muestra la navegación según el rol:
 * DIRIGENTA → /panel/... · ADMIN → /admin/...
 */
@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './panel.layout.html',
})
export class PanelLayout {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuAbierto = signal(false);

  readonly enlaces = computed<EnlacePanel[]>(() =>
    this.auth.esAdmin()
      ? [
          { ruta: '/admin/ollas', texto: 'Ollas comunes' },
          { ruta: '/admin/usuarios', texto: 'Usuarios' },
          { ruta: '/admin/auditoria', texto: 'Auditoría por olla' },
        ]
      : [
          { ruta: '/panel/mi-olla', texto: 'Mi olla' },
          { ruta: '/panel/inventario', texto: 'Inventario PEPS' },
          { ruta: '/panel/donaciones', texto: 'Donantes y donaciones' },
          { ruta: '/panel/recetas', texto: 'Recetas y despacho' },
          { ruta: '/panel/reportes', texto: 'Kardex y reportes' },
        ],
  );

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  salir(): void {
    this.auth.salir();
  }

  irAlPortal(): void {
    this.cerrarMenu();
    this.router.navigate(['/']);
  }
}
