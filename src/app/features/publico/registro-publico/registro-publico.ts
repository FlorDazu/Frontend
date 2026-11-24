import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/error-api';
import type { OllaPublica, RespuestaOllaNueva, Ubigeo } from '../../../core/models';
import { PublicService } from '../../../core/services/public.service';
import { ToastService } from '../../../core/toast.service';

/** HU-04 · Registro directo de una nueva olla común, sin cuenta (201). */
@Component({
  selector: 'app-registro-publico',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro-publico.html',
})
export class RegistroPublico implements OnInit {
  private readonly publico = inject(PublicService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  private ubigeos: Ubigeo[] = [];
  departamentos: string[] = [];
  provincias: string[] = [];
  distritos: Ubigeo[] = [];

  departamentoSel = '';
  provinciaSel = '';
  distritoSel = '';

  nombre = '';
  direccion = '';
  telefono = '';
  referencia = '';
  beneficiarios = 0;

  cargando = signal(false);
  error = signal('');
  creada = signal<RespuestaOllaNueva | null>(null);

  ngOnInit(): void {
    this.publico.ubigeos().subscribe({
      next: (ubigeos) => {
        this.ubigeos = ubigeos;
        this.departamentos = [...new Set(ubigeos.map((u) => u.departamento))].sort((a, b) =>
          a.localeCompare(b, 'es'),
        );
      },
      error: (err) => this.error.set(mensajeDeError(err)),
    });
  }

  alCambiarDepartamento(): void {
    this.provinciaSel = '';
    this.distritoSel = '';
    this.provincias = this.unicos(
      this.ubigeos.filter((u) => u.departamento === this.departamentoSel).map((u) => u.provincia),
    );
    this.distritos = [];
  }

  alCambiarProvincia(): void {
    this.distritoSel = '';
    this.distritos = this.ubigeos.filter(
      (u) => u.departamento === this.departamentoSel && u.provincia === this.provinciaSel,
    );
  }

  enviar(): void {
    this.error.set('');

    if (this.nombre.trim().length < 3) {
      this.error.set('El nombre de la olla debe tener al menos 3 caracteres.');
      return;
    }
    if (!this.distritoSel) {
      this.error.set('Seleccione departamento, provincia y distrito de la olla.');
      return;
    }
    if (this.direccion.trim().length < 5) {
      this.error.set('La dirección debe tener al menos 5 caracteres.');
      return;
    }
    const telefono = this.telefono.replace(/[\s\-()]/g, '');
    if (!/^\+?\d{6,15}$/.test(telefono)) {
      this.error.set('El teléfono debe contener solo números (entre 6 y 15 dígitos), por ejemplo 987654321.');
      return;
    }
    if (this.beneficiarios < 0) {
      this.error.set('La cantidad de beneficiarias(os) no puede ser negativa.');
      return;
    }

    this.cargando.set(true);
    this.publico
      .registrar({
        nombre: this.nombre.trim(),
        id_ubigeo: Number(this.distritoSel),
        direccion: this.direccion.trim(),
        telefono,
        referencia: this.referencia.trim() || null,
        beneficiarios: this.beneficiarios,
      })
      .subscribe({
        next: (respuesta) => {
          this.cargando.set(false);
          this.creada.set(respuesta);
          this.toast.exito(respuesta.mensaje);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(mensajeDeError(err));
        },
      });
  }

  reiniciar(): void {
    this.creada.set(null);
    this.nombre = '';
    this.direccion = '';
    this.telefono = '';
    this.referencia = '';
    this.beneficiarios = 0;
    this.departamentoSel = '';
    this.provinciaSel = '';
    this.distritoSel = '';
    this.provincias = [];
    this.distritos = [];
  }

  verFicha(olla: OllaPublica): void {
    this.router.navigate(['/ollas', olla.id_olla]);
  }

  private unicos(valores: string[]): string[] {
    return [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'es'));
  }
}
