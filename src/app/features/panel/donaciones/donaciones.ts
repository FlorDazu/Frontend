import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { fDecimal, fFechaHora, fSoles } from '../../../core/formato';
import { mensajeDeError } from '../../../core/error-api';
import type {
  Donacion,
  Donante,
  Insumo,
  TipoDonacion,
  TipoDonante,
} from '../../../core/models';
import { DonacionesService } from '../../../core/services/donaciones.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { ToastService } from '../../../core/toast.service';
import { aUnidadBase, nombreUnidad, opcionesUnidad, requiereConversion, unidadPorDefecto, type OpcionUnidad } from '../../../core/unidades';

type Pestana = 'donaciones' | 'donantes';

interface FilaItem {
  id_insumo: number | null;
  cantidad: number | null;
  /** Unidad en la que se escribió la cantidad (se convierte a la unidad base al enviar). */
  unidad: string;
  fecha_vencimiento: string;
}

const TIPOS_DONANTE: TipoDonante[] = ['PERSONA_NATURAL', 'EMPRESA', 'MERCADO', 'INSTITUCION'];

/** HU-09 / HU-10 · Directorio de donantes y registro de donaciones. */
@Component({
  selector: 'app-donaciones',
  imports: [FormsModule],
  templateUrl: './donaciones.html',
})
export class Donaciones implements OnInit {
  private readonly donacionesService = inject(DonacionesService);
  private readonly inventarioService = inject(InventarioService);
  private readonly toast = inject(ToastService);

  readonly fDecimal = fDecimal;
  readonly fFechaHora = fFechaHora;
  readonly fSoles = fSoles;
  readonly tiposDonante = TIPOS_DONANTE;

  pestana: Pestana = 'donaciones';

  donaciones = signal<Donacion[]>([]);
  donantes = signal<Donante[]>([]);
  insumos = signal<Insumo[]>([]);

  cargando = signal(false);
  error = signal('');
  guardando = signal(false);
  errorForm = signal('');

  // Filtros
  filtroTipoDonacion: '' | TipoDonacion = '';
  filtroTipoDonante: '' | TipoDonante = '';
  filtroFrecuente: '' | '1' | '0' = '';
  busquedaDonante = '';

  // Detalle de lotes por donación
  donacionAbierta = 0;

  // Formulario de donación
  mostrarForm = false;
  form = {
    tipo_donacion: 'ESPECIE' as TipoDonacion,
    id_donante: '' as string,
    descripcion: '',
    monto_soles: null as number | null,
    comprobante: '',
  };
  items: FilaItem[] = [this.nuevaFila()];

  // Formulario de donante
  mostrarFormDonante = false;
  formDonante = {
    tipo_donante: 'PERSONA_NATURAL' as TipoDonante,
    nombre_razon_social: '',
    documento: '',
    telefono: '',
    direccion: '',
    es_frecuente: false,
  };

  ngOnInit(): void {
    this.cargarDonaciones();
    this.cargarDonantes();
    this.inventarioService.insumos().subscribe({
      next: (insumos) => this.insumos.set(insumos),
      error: (err) => this.error.set(mensajeDeError(err)),
    });
  }

  cambiarPestana(pestana: Pestana): void {
    this.pestana = pestana;
    if (pestana === 'donaciones') this.cargarDonaciones();
    else this.cargarDonantes();
  }

  // ------------------------------------------------------------------ donaciones

  cargarDonaciones(): void {
    this.cargando.set(true);
    this.error.set('');
    this.donacionesService.donaciones({ tipo_donacion: this.filtroTipoDonacion || undefined }).subscribe({
      next: (donaciones) => {
        this.donaciones.set(donaciones);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(mensajeDeError(err));
        this.cargando.set(false);
      },
    });
  }

  alternarDetalle(idDonacion: number): void {
    this.donacionAbierta = this.donacionAbierta === idDonacion ? 0 : idDonacion;
  }

  nuevaFila(): FilaItem {
    return { id_insumo: null, cantidad: null, unidad: '', fecha_vencimiento: '' };
  }

  agregarFila(): void {
    this.items.push(this.nuevaFila());
  }

  quitarFila(indice: number): void {
    if (this.items.length > 1) this.items.splice(indice, 1);
  }

  insumoRequiereVencimiento(idInsumo: number | string | null): boolean {
    if (idInsumo === null) return false;
    return !!this.insumos().find((i) => i.id_insumo === Number(idInsumo))?.requiere_vencimiento;
  }

  // --- Unidades: cada insumo se guarda en su unidad base (kg, L o unidades) ---
  readonly nombreUnidad = nombreUnidad;
  readonly requiereConversion = requiereConversion;

  unidadDe(idInsumo: number | string | null | undefined): string {
    return this.insumos().find((i) => i.id_insumo === Number(idInsumo))?.unidad_base ?? '';
  }

  opcionesDe(idInsumo: number | string | null | undefined): OpcionUnidad[] {
    return opcionesUnidad(this.unidadDe(idInsumo));
  }

  /** Cantidad del ítem convertida a la unidad base del insumo. */
  cantidadBase(fila: FilaItem): number | null {
    return aUnidadBase(fila.cantidad, this.unidadDe(fila.id_insumo), fila.unidad);
  }

  alCambiarInsumo(fila: FilaItem): void {
    fila.unidad = unidadPorDefecto(this.unidadDe(fila.id_insumo));
  }

  enviarDonacion(): void {
    this.errorForm.set('');

    if (this.form.descripcion.trim().length < 3) {
      this.errorForm.set('Describa la donación (mínimo 3 caracteres).');
      return;
    }

    if (this.form.tipo_donacion === 'MONETARIA') {
      if (!(this.form.monto_soles && this.form.monto_soles > 0)) {
        this.errorForm.set('Para una donación monetaria debe indicar un monto en soles mayor a cero.');
        return;
      }
    } else {
      if (!this.items.length) {
        this.errorForm.set('Agregue al menos un insumo a la donación en especie.');
        return;
      }
      for (const [indice, fila] of this.items.entries()) {
        if (fila.id_insumo === null) {
          this.errorForm.set(`Seleccione el insumo del ítem ${indice + 1}.`);
          return;
        }
        const cantidad = this.cantidadBase(fila);
        if (cantidad === null || cantidad < 0.01) {
          this.errorForm.set(
            `La cantidad del ítem ${indice + 1} debe equivaler al menos a 0.01 ${this.nombreUnidad(this.unidadDe(fila.id_insumo))}.`,
          );
          return;
        }
        if (this.insumoRequiereVencimiento(fila.id_insumo) && !fila.fecha_vencimiento) {
          this.errorForm.set(`El insumo del ítem ${indice + 1} requiere fecha de vencimiento.`);
          return;
        }
      }
    }

    this.guardando.set(true);
    this.donacionesService
      .crearDonacion({
        tipo_donacion: this.form.tipo_donacion,
        id_donante: this.form.id_donante ? Number(this.form.id_donante) : null,
        monto_soles: this.form.tipo_donacion === 'MONETARIA' ? this.form.monto_soles : null,
        comprobante: this.form.comprobante.trim() || null,
        descripcion: this.form.descripcion.trim(),
        items:
          this.form.tipo_donacion === 'ESPECIE'
            ? this.items.map((fila) => ({
                id_insumo: Number(fila.id_insumo),
                cantidad: this.cantidadBase(fila) ?? 0,
                fecha_vencimiento: fila.fecha_vencimiento || null,
              }))
            : [],
      })
      .subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.toast.exito(respuesta.mensaje);
          this.cerrarFormDonacion();
          this.cargarDonaciones();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorForm.set(mensajeDeError(err));
        },
      });
  }

  cerrarFormDonacion(): void {
    this.mostrarForm = false;
    this.form = {
      tipo_donacion: 'ESPECIE',
      id_donante: '',
      descripcion: '',
      monto_soles: null,
      comprobante: '',
    };
    this.items = [this.nuevaFila()];
    this.errorForm.set('');
  }

  alternarFormDonacion(): void {
    if (this.mostrarForm) this.cerrarFormDonacion();
    else {
      this.mostrarForm = true;
      this.errorForm.set('');
    }
  }

  alternarFormDonante(): void {
    if (this.mostrarFormDonante) this.cerrarFormDonante();
    else {
      this.mostrarFormDonante = true;
      this.errorForm.set('');
    }
  }

  // ------------------------------------------------------------------- donantes

  cargarDonantes(): void {
    this.cargando.set(true);
    this.error.set('');
    this.donacionesService
      .donantes({
        tipo_donante: this.filtroTipoDonante || undefined,
        es_frecuente: this.filtroFrecuente === '' ? undefined : this.filtroFrecuente === '1',
        q: this.busquedaDonante.trim() || undefined,
      })
      .subscribe({
        next: (donantes) => {
          this.donantes.set(donantes);
          this.cargando.set(false);
        },
        error: (err) => {
          this.error.set(mensajeDeError(err));
          this.cargando.set(false);
        },
      });
  }

  enviarDonante(): void {
    this.errorForm.set('');

    if (this.formDonante.nombre_razon_social.trim().length < 2) {
      this.errorForm.set('Ingrese el nombre o razón social del donante (mínimo 2 caracteres).');
      return;
    }
    const documento = this.formDonante.documento.trim();
    if (documento && !/^[A-Za-z0-9\-]{4,20}$/.test(documento)) {
      this.errorForm.set('El documento solo puede contener letras, números o guiones (entre 4 y 20 caracteres).');
      return;
    }
    const telefono = this.formDonante.telefono.trim();
    if (telefono) {
      const limpio = telefono.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{6,15}$/.test(limpio)) {
        this.errorForm.set('El teléfono debe contener solo números (entre 6 y 15 dígitos).');
        return;
      }
      this.formDonante.telefono = limpio;
    }

    this.guardando.set(true);
    this.donacionesService
      .crearDonante({
        tipo_donante: this.formDonante.tipo_donante,
        nombre_razon_social: this.formDonante.nombre_razon_social.trim(),
        documento: documento || null,
        telefono: telefono || null,
        direccion: this.formDonante.direccion.trim() || null,
        es_frecuente: this.formDonante.es_frecuente,
      })
      .subscribe({
        next: (respuesta) => {
          this.guardando.set(false);
          this.toast.exito(respuesta.mensaje);
          this.cerrarFormDonante();
          this.cargarDonantes();
        },
        error: (err) => {
          this.guardando.set(false);
          this.errorForm.set(mensajeDeError(err));
        },
      });
  }

  cerrarFormDonante(): void {
    this.mostrarFormDonante = false;
    this.formDonante = {
      tipo_donante: 'PERSONA_NATURAL',
      nombre_razon_social: '',
      documento: '',
      telefono: '',
      direccion: '',
      es_frecuente: false,
    };
    this.errorForm.set('');
  }

  etiquetaTipoDonante(tipo: TipoDonante): string {
    return {
      PERSONA_NATURAL: 'Persona natural',
      EMPRESA: 'Empresa',
      MERCADO: 'Mercado',
      INSTITUCION: 'Institución',
    }[tipo];
  }
}
