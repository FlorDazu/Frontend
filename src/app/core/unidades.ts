/**
 * Unidades de medida de los insumos.
 *
 * Cada insumo tiene UNA unidad base en la base de datos (`insumos.unidad_base`:
 * `kg`, `L` o `unidades`) y todo el inventario PEPS, el kardex y las recetas se
 * guardan en esa unidad. Para registrar más cómodo, los formularios permiten
 * escribir la cantidad en una unidad equivalente (gramos, sacos, botellas,
 * cajas…) y aquí se convierte a la unidad base ANTES de enviarla a la API.
 */

export interface OpcionUnidad {
  /** Identificador interno de la opción. */
  codigo: string;
  /** Texto visible en el selector. */
  etiqueta: string;
  /** Cuántas unidades base equivale UNA de esta unidad. */
  factor: number;
}

const OPCIONES: Record<string, OpcionUnidad[]> = {
  kg: [
    { codigo: 'kg', etiqueta: 'kg', factor: 1 },
    { codigo: 'g', etiqueta: 'gramos (g)', factor: 0.001 },
    { codigo: 'saco25', etiqueta: 'saco de 25 kg', factor: 25 },
    { codigo: 'saco50', etiqueta: 'saco de 50 kg', factor: 50 },
  ],
  L: [
    { codigo: 'L', etiqueta: 'litros (L)', factor: 1 },
    { codigo: 'ml', etiqueta: 'mililitros (ml)', factor: 0.001 },
    { codigo: 'botella1', etiqueta: 'botella de 1 L', factor: 1 },
    { codigo: 'galonera5', etiqueta: 'galonera de 5 L', factor: 5 },
  ],
  unidades: [
    { codigo: 'unidades', etiqueta: 'unidades', factor: 1 },
    { codigo: 'docena', etiqueta: 'docena (12)', factor: 12 },
    { codigo: 'caja24', etiqueta: 'caja de 24', factor: 24 },
  ],
};

/** Nombre corto de la unidad base para etiquetas y totales. */
export function nombreUnidad(unidadBase: string | null | undefined): string {
  if (unidadBase === 'L') return 'L';
  if (unidadBase === 'kg') return 'kg';
  return unidadBase ? 'unidades' : '';
}

/** Opciones de registro para una unidad base (la primera es siempre la propia unidad base). */
export function opcionesUnidad(unidadBase: string | null | undefined): OpcionUnidad[] {
  if (!unidadBase) return [];
  return OPCIONES[unidadBase] ?? [{ codigo: unidadBase, etiqueta: unidadBase, factor: 1 }];
}

/** Código de la opción por defecto (la unidad base). */
export function unidadPorDefecto(unidadBase: string | null | undefined): string {
  return opcionesUnidad(unidadBase)[0]?.codigo ?? '';
}

/**
 * Convierte una cantidad escrita en `codigo` a la unidad base, redondeada a
 * 2 decimales (lo que admite la base de datos). Devuelve null si no es válida.
 */
export function aUnidadBase(cantidad: number | null | undefined, unidadBase: string | null | undefined, codigo: string): number | null {
  const valor = Number(cantidad);
  if (!Number.isFinite(valor) || valor <= 0) return null;
  const opcion = opcionesUnidad(unidadBase).find((o) => o.codigo === codigo) ?? opcionesUnidad(unidadBase)[0];
  if (!opcion) return null;
  return Math.round(valor * opcion.factor * 100) / 100;
}

/** True si la opción elegida no es la unidad base (para mostrar la equivalencia). */
export function requiereConversion(unidadBase: string | null | undefined, codigo: string): boolean {
  return !!codigo && codigo !== unidadPorDefecto(unidadBase);
}
