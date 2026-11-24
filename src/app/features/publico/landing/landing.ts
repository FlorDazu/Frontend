import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { fEntero, fSoles } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { Kpis, OllaPublica, Ubigeo } from '../../../core/models';
import { PublicService } from '../../../core/services/public.service';

/**
 * Portal principal: hero con foto y dato en vivo, buscador geográfico,
 * indicadores de impacto, vitrina de ollas que necesitan apoyo y los
 * tres pasos del ayni. Todo con datos reales de GET /api/public/*.
 */
@Component({
  selector: 'app-landing',
  imports: [FormsModule, RouterLink],
  templateUrl: './landing.html',
})
export class Landing implements OnInit {
  private readonly publico = inject(PublicService);
  private readonly router = inject(Router);

  readonly fEntero = fEntero;
  readonly fSoles = fSoles;

  kpis = signal<Kpis | null>(null);
  cargando = signal(true);
  error = signal('');

  /** Ollas reales de la vitrina "necesitan tu apoyo hoy". */
  vitrina = signal<OllaPublica[]>([]);
  cargandoVitrina = signal(true);

  private ubigeos: Ubigeo[] = [];
  departamentos: string[] = [];
  provincias: string[] = [];
  distritos: string[] = [];

  departamentoSel = '';
  provinciaSel = '';
  distritoSel = '';

  ngOnInit(): void {
    this.publico.kpis().subscribe({
      next: (kpis) => {
        this.kpis.set(kpis);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });

    this.publico.ubigeos().subscribe({
      next: (ubigeos) => {
        this.ubigeos = ubigeos;
        this.departamentos = this.unicos(ubigeos.map((u) => u.departamento));
      },
      error: () => {
        /* el buscador sigue funcionando sin catálogo */
      },
    });

    this.publico.ollas().subscribe({
      next: (ollas) => {
        // Primero las que atienden hoy, y como máximo seis tarjetas.
        const ordenadas = [...ollas].sort(
          (a, b) => Number(Boolean(b.atiende_hoy)) - Number(Boolean(a.atiende_hoy)),
        );
        this.vitrina.set(ordenadas.slice(0, 6));
        this.cargandoVitrina.set(false);
      },
      error: () => {
        /* la vitrina es decorativa: la página no depende de ella */
        this.cargandoVitrina.set(false);
      },
    });
  }

  alCambiarDepartamento(): void {
    this.provinciaSel = '';
    this.distritoSel = '';
    this.refrescarListas();
  }

  alCambiarProvincia(): void {
    this.distritoSel = '';
    this.refrescarListas();
  }

  buscar(): void {
    this.router.navigate(['/ollas'], {
      queryParams: {
        departamento: this.departamentoSel,
        provincia: this.provinciaSel,
        distrito: this.distritoSel,
      },
    });
  }

  /** Insumos que necesita la olla, convertidos en etiquetas legibles. */
  insumos(olla: OllaPublica): string[] {
    const texto = olla.necesidades_urgentes?.trim();
    if (!texto) return [];
    return texto
      .split(/[,;\n]+/)
      .map((parte) => parte.trim())
      .filter(Boolean)
      .slice(0, 5);
  }

  private refrescarListas(): void {
    const porDepartamento = this.departamentoSel
      ? this.ubigeos.filter((u) => u.departamento === this.departamentoSel)
      : this.ubigeos;
    this.provincias = this.unicos(porDepartamento.map((u) => u.provincia));
    const porProvincia = this.provinciaSel
      ? porDepartamento.filter((u) => u.provincia === this.provinciaSel)
      : porDepartamento;
    this.distritos = this.unicos(porProvincia.map((u) => u.distrito));
  }

  private unicos(valores: string[]): string[] {
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'es'));
  }
}
