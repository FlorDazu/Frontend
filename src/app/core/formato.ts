/** Formateadores de presentación (es-PE) usados en las plantillas. */

const decimales = new Intl.NumberFormat('es-PE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const enteros = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

/** 12.5 → "12.5"; null → "—" */
export function fDecimal(valor: unknown, decimalesFijos = false): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const n = typeof valor === 'string' ? Number(valor) : (valor as number);
  if (Number.isNaN(n)) return String(valor);
  if (decimalesFijos) {
    return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return decimales.format(n);
}

/** 1234 → "1,234" */
export function fEntero(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  const n = typeof valor === 'string' ? Number(valor) : (valor as number);
  return Number.isNaN(n) ? String(valor) : enteros.format(n);
}

/** 250 → "S/ 250.00" */
export function fSoles(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return 'S/ —';
  const n = typeof valor === 'string' ? Number(valor) : (valor as number);
  if (Number.isNaN(n)) return String(valor);
  return 'S/ ' + n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** "2026-11-19T22:27:19.988" o "2026-11-17" → "19/11/2026" */
export function fFecha(valor: string | null | undefined): string {
  if (!valor) return '—';
  const fecha = valor.split('T')[0];
  const [a, m, d] = fecha.split('-');
  if (!a || !m || !d) return valor;
  return `${d}/${m}/${a}`;
}

/** Igual que fFecha pero añade "HH:mm". */
export function fFechaHora(valor: string | null | undefined): string {
  if (!valor) return '—';
  const hora = valor.includes('T') ? valor.split('T')[1].slice(0, 5) : '';
  return hora ? `${fFecha(valor)} ${hora}` : fFecha(valor);
}

/** true → "Sí", false → "No", null → "—" */
export function fSiNo(valor: boolean | null | undefined): string {
  if (valor === null || valor === undefined) return '—';
  return valor ? 'Sí' : 'No';
}
