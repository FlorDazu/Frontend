import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { fEntero, fFecha, fSiNo } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type { OllaPublica } from '../../../core/models';
import { PublicService } from '../../../core/services/public.service';

/** HU-03 · Ficha pública detallada de una olla común. */
@Component({
  selector: 'app-olla-detalle',
  imports: [RouterLink],
  templateUrl: './olla-detalle.html',
})
export class OllaDetalle implements OnInit {
  private readonly publico = inject(PublicService);
  private readonly ruta = inject(ActivatedRoute);

  readonly fEntero = fEntero;
  readonly fFecha = fFecha;
  readonly fSiNo = fSiNo;

  olla = signal<OllaPublica | null>(null);
  cargando = signal(true);
  error = signal('');
  idOlla = 0;

  ngOnInit(): void {
    this.idOlla = Number(this.ruta.snapshot.paramMap.get('id'));
    this.publico.olla(this.idOlla).subscribe({
      next: (olla) => {
        this.olla.set(olla);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }
}
