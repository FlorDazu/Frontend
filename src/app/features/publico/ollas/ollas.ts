import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fEntero } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { OllaPublica, Ubigeo } from '../../../core/models';
import { PublicService } from '../../../core/services/public.service';

/**
 * HU-02 · Directorio público de ollas con filtros de distrito y búsqueda
 * por nombre o código (recibe los filtros por query params).
 */
@Component({
  selector: 'app-directorio-ollas',
  imports: [FormsModule, RouterLink],
  templateUrl: './ollas.html',
})
export class DirectorioOllas implements OnInit {
  private readonly publico = inject(PublicService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  readonly fEntero = fEntero;

  ollas = signal<OllaPublica[]>([]);
  cargando = signal(true);
  error = signal('');
  total = signal(0);

  private ubigeos: Ubigeo[] = [];
  departamentos: string[] = [];
  provincias: string[] = [];
  distritos: string[] = [];

  departamentoSel = '';
  provinciaSel = '';
  distritoSel = '';
  q = '';
  atiendeSel = '';

  ngOnInit(): void {
    const params = this.ruta.snapshot.queryParamMap;
    this.departamentoSel = params.get('departamento') ?? '';
    this.provinciaSel = params.get('provincia') ?? '';
    this.distritoSel = params.get('distrito') ?? '';
    this.q = params.get('q') ?? '';

    this.publico.ubigeos().subscribe({
      next: (ubigeos) => {
        this.ubigeos = ubigeos;
        this.departamentos = this.unicos(ubigeos.map((u) => u.departamento));
        this.refrescarListas();
      },
      error: () => undefined,
    });

    this.buscar();
  }

  buscar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.publico
      .ollas({
        departamento: this.departamentoSel,
        provincia: this.provinciaSel,
        distrito: this.distritoSel,
        q: this.q.trim(),
        atiende_hoy: this.atiendeSel === '' ? undefined : this.atiendeSel === '1',
      })
      .subscribe({
        next: (ollas) => {
          this.ollas.set(ollas);
          this.total.set(ollas.length);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargando.set(false);
        },
      });

    // Mantiene la URL compartible con los filtros actuales.
    this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: {
        departamento: this.departamentoSel,
        provincia: this.provinciaSel,
        distrito: this.distritoSel,
        q: this.q.trim() || null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }

  alCambiarDepartamento(): void {
    this.provinciaSel = '';
    this.distritoSel = '';
    this.refrescarListas();
    this.buscar();
  }

  alCambiarProvincia(): void {
    this.distritoSel = '';
    this.refrescarListas();
    this.buscar();
  }

  limpiar(): void {
    this.departamentoSel = '';
    this.provinciaSel = '';
    this.distritoSel = '';
    this.q = '';
    this.atiendeSel = '';
    this.refrescarListas();
    this.buscar();
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
