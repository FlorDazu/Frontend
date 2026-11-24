import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  type ValidationErrors,
  Validators,
} from '@angular/forms';

/** Acepta un correo electrónico o un teléfono con al menos 6 dígitos. */
function contactoValido(control: AbstractControl): ValidationErrors | null {
  const valor: string = (control.value ?? '').trim();
  if (!valor) return null; // la obligatoriedad la cubre Validators.required
  const esCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor);
  const digitos = valor.replace(/\D/g, '');
  const esTelefono = digitos.length >= 6 && /^[\d\s\-().+]+$/.test(valor);
  return esCorreo || esTelefono ? null : { contacto: true };
}

const MENSAJES: Record<string, string> = {
  nombre: 'Escriba su nombre completo (mínimo 3 letras).',
  contacto: 'Escriba un correo electrónico o un teléfono válido, por ejemplo contacto@correo.com o 987654321.',
  tipo: 'Elija el tipo de consulta.',
  mensaje: 'Cuéntenos su consulta con al menos 10 caracteres.',
};

/**
 * Contáctanos: información institucional + formulario reactivo validado.
 * El envío es local (no hay endpoint de contacto en la API) y muestra una
 * confirmación visual clara.
 */
@Component({
  selector: 'app-contactanos',
  imports: [ReactiveFormsModule],
  templateUrl: './contactanos.html',
})
export class Contactanos {
  private readonly fb = inject(FormBuilder);

  /** true tras un envío válido: reemplaza el formulario por la confirmación. */
  readonly enviado = signal(false);

  readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    contacto: ['', [Validators.required, contactoValido]],
    tipo: ['', [Validators.required]],
    mensaje: ['', [Validators.required, Validators.minLength(10)]],
  });

  /** Marca todos los campos como tocados para mostrar los errores. */
  enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviado.set(true);
  }

  /** Vuelve al formulario vacío desde la confirmación. */
  nuevoMensaje(): void {
    this.formulario.reset({ nombre: '', contacto: '', tipo: '', mensaje: '' });
    this.enviado.set(false);
  }

  /** true si el campo ya fue tocado y sigue inválido (para el estilo de Bootstrap). */
  esInvalido(campo: string): boolean {
    const control = this.formulario.get(campo);
    return !!control && control.invalid && control.touched;
  }

  /** Mensaje de error en español para un campo, o '' si es válido. */
  errorDe(campo: string): string {
    const control = this.formulario.get(campo);
    if (!control || !control.invalid || !control.touched) return '';
    if (control.hasError('required')) return `El campo es obligatorio.`;
    return MENSAJES[campo] ?? 'Revise este campo.';
  }

  /** Clase de borde rojo solo cuando el campo ya fue tocado y es inválido. */
  claseDe(campo: string): string {
    return this.errorDe(campo) ? 'campo mb-3 campo-invalido' : 'campo mb-3';
  }
}
