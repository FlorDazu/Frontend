import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fEntero } from '../../../core/formato';
import type { Kpis } from '../../../core/models';
import { PublicService } from '../../../core/services/public.service';

/**
 * Página institucional: filosofía del ayni, propósito, pilares del sistema
 * y resultados comunitarios (la cifra de ollas proviene de GET /api/public/kpis).
 */
@Component({
  selector: 'app-nosotros',
  imports: [RouterLink],
  templateUrl: './nosotros.html',
})
export class Nosotros implements OnInit {
  private readonly publico = inject(PublicService);

  readonly fEntero = fEntero;

  kpis = signal<Kpis | null>(null);
  cargando = signal(true);

  ngOnInit(): void {
    this.publico.kpis().subscribe({
      next: (kpis) => {
        this.kpis.set(kpis);
        this.cargando.set(false);
      },
      error: () => {
        /* sin API la página sigue siendo legible con la cifra de respaldo */
        this.cargando.set(false);
      },
    });
  }

  /** Ollas activas reales; si la API no responde, se muestra un respaldo honesto. */
  get ollasRegistradas(): string {
    const kpis = this.kpis();
    return kpis ? this.fEntero(kpis.ollas_activas) : '+50';
  }
}
