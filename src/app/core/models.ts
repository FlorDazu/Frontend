/**
 * Espejo TypeScript de backend/app/schemas.py y de las respuestas de
 * backend/app/routers/* (los 8 routers). Los nombres de campo deben
 * coincidir exactamente con los del backend.
 */

export type Rol = 'ADMIN' | 'DIRIGENTA';
export type TipoDonante = 'PERSONA_NATURAL' | 'EMPRESA' | 'MERCADO' | 'INSTITUCION';
export type TipoDonacion = 'ESPECIE' | 'MONETARIA';
export type Semaforo = 'VIGENTE' | 'POR_VENCER' | 'VENCIDO';
export type EstadoLote = 'ACTIVO' | 'AGOTADO' | 'DESCARTADO';
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'DESCARTE';

/** Toda respuesta exitosa de POST/PUT/PATCH incluye "mensaje" (HU-13). */
export interface RespuestaMensaje {
  mensaje: string;
}

/** Respuestas de escritura cuyo cuerpo adicional interesa poco (claves del SP). */
export type RespuestaConClaves = RespuestaMensaje & Record<string, unknown>;

// ---------------------------------------------------------------------------
// Portal público (HU-01 a HU-04)
// ---------------------------------------------------------------------------

export interface Kpis {
  ollas_activas: number;
  ollas_atienden_hoy: number;
  beneficiarios_hoy: number;
  beneficiarios_totales: number;
  distritos_cubiertos: number;
  total_donaciones: number;
  monto_donado_soles: number;
  total_movimientos: number;
}

export interface Ubigeo {
  id_ubigeo: number;
  departamento: string;
  provincia: string;
  distrito: string;
}

export interface OllaPublica {
  id_olla: number;
  codigo_unico: string;
  nombre: string;
  direccion: string;
  referencia: string | null;
  telefono: string;
  beneficiarios: number;
  atiende_hoy: boolean | null;
  recibe_frescos: boolean | null;
  necesidades_urgentes: string | null;
  verificada: boolean;
  fecha_registro: string;
  id_ubigeo: number;
  departamento: string;
  provincia: string;
  distrito: string;
}

/** SQL_OLLA_RESUMEN (auth/olla): además de la ficha pública incluye `activada`. */
export interface OllaResumen extends OllaPublica {
  activada: boolean;
}

/** SQL_OLLAS_ADMIN: además de `activada` incluye el contador de usuarias. */
export interface OllaAdmin extends OllaResumen {
  total_usuarios: number;
}

export interface OllaRegistro {
  nombre: string;
  id_ubigeo: number;
  direccion: string;
  telefono: string;
  referencia?: string | null;
  beneficiarios?: number;
}

export interface RespuestaOllaNueva extends RespuestaMensaje {
  olla: OllaPublica;
}

// ---------------------------------------------------------------------------
// Autenticación (HU-06 / HU-07)
// ---------------------------------------------------------------------------

export interface Perfil {
  id_usuario: number;
  nombre_completo: string;
  username: string;
  telefono: string;
  rol: Rol;
  id_olla: number | null;
  // Solo en GET /api/auth/me:
  activo?: boolean;
  fecha_creacion?: string;
  olla?: OllaResumen | null;
}

export interface LoginDatos {
  username: string;
  password: string;
}

export interface Sesion {
  mensaje: string;
  access_token: string;
  token_type: string;
  rol: Rol;
  usuario: Perfil;
  olla: OllaResumen | null;
}

export interface RegistroCuentaDatos {
  nombre_completo: string;
  username: string;
  telefono: string;
  password: string;
  nombre_olla: string;
  id_ubigeo: number;
  direccion: string;
  referencia?: string | null;
}

// ---------------------------------------------------------------------------
// Panel dirigenta: olla y estado diario (HU-08)
// ---------------------------------------------------------------------------

export interface EstadoDiario {
  atiende_hoy?: boolean;
  recibe_frescos?: boolean;
  beneficiarios?: number;
  necesidades_urgentes?: string | null;
}

export interface RespuestaOlla extends RespuestaMensaje {
  olla: OllaResumen;
}

// ---------------------------------------------------------------------------
// Inventario PEPS (HU-11)
// ---------------------------------------------------------------------------

export interface Insumo {
  id_insumo: number;
  nombre: string;
  categoria: string;
  unidad_base: string;
  requiere_vencimiento: boolean;
  stock_minimo: number;
}

export interface StockInsumo extends Insumo {
  stock_actual: number;
  stock_vencido: number;
  lotes_activos: number;
  proximo_vencimiento: string | null;
  alerta_stock_bajo: boolean;
  faltante_para_minimo: number;
}

export interface ResumenStock {
  insumos_catalogo: number;
  insumos_con_stock: number;
  insumos_stock_bajo: number;
  insumos_con_vencidos: number;
}

export interface RespuestaStock {
  resumen: ResumenStock;
  insumos: StockInsumo[];
}

export interface Lote {
  id_lote: number;
  codigo_lote: string;
  id_insumo: number;
  insumo: string;
  categoria: string;
  unidad_base: string;
  id_donacion: number | null;
  cantidad_inicial: number;
  cantidad_disponible: number;
  fecha_ingreso: string;
  fecha_vencimiento: string | null;
  estado: EstadoLote;
  dias_para_vencer: number | null;
  semaforo: Semaforo;
}

export interface EntradaInventario {
  id_insumo: number;
  cantidad: number;
  fecha_vencimiento?: string | null;
  motivo?: string | null;
}

export interface SalidaInventario {
  id_insumo: number;
  cantidad: number;
  motivo?: string | null;
}

export interface DescarteLote {
  id_lote: number;
  motivo: string;
}

export interface MovimientoParcial {
  codigo_correlativo: string;
  codigo_lote: string | null;
  cantidad: number;
  saldo_posterior: number;
}

export interface RespuestaSalida extends RespuestaConClaves {
  movimientos?: MovimientoParcial[];
}

// ---------------------------------------------------------------------------
// Donantes y donaciones (HU-09 / HU-10)
// ---------------------------------------------------------------------------

export interface Donante {
  id_donante: number;
  tipo_donante: TipoDonante;
  nombre_razon_social: string;
  documento: string | null;
  telefono: string | null;
  direccion: string | null;
  es_frecuente: boolean;
  fecha_registro: string;
  total_donaciones: number;
}

export interface DonanteCrear {
  tipo_donante: TipoDonante;
  nombre_razon_social: string;
  documento?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  es_frecuente?: boolean;
}

export interface ItemDonacion {
  id_insumo: number;
  cantidad: number;
  fecha_vencimiento?: string | null;
}

export interface DonacionCrear {
  tipo_donacion: TipoDonacion;
  id_donante?: number | null;
  monto_soles?: number | null;
  comprobante?: string | null;
  descripcion: string;
  items: ItemDonacion[];
}

export interface ItemLoteDonacion {
  id_lote: number;
  codigo_lote: string;
  id_insumo: number;
  insumo: string;
  unidad_base: string;
  cantidad_inicial: number;
  cantidad_disponible: number;
  fecha_vencimiento: string | null;
  estado: EstadoLote;
}

export interface Donacion {
  id_donacion: number;
  tipo_donacion: TipoDonacion;
  monto_soles: number | null;
  comprobante: string | null;
  descripcion: string;
  fecha_donacion: string;
  id_donante: number | null;
  donante: string | null;
  tipo_donante: TipoDonante | null;
  items: ItemLoteDonacion[];
}

export interface RespuestaDonante extends RespuestaMensaje {
  donante: Donante;
}

export interface RespuestaDonacion extends RespuestaMensaje {
  id_donacion: number;
  lotes: ItemLoteDonacion[];
}

// ---------------------------------------------------------------------------
// Recetas (HU-12)
// ---------------------------------------------------------------------------

export interface IngredienteReceta {
  id_insumo: number;
  insumo: string;
  unidad_base: string;
  cantidad_base: number;
  cantidad_requerida: number;
  stock_vigente: number;
  alcanza: boolean;
  faltante: number;
}

export interface Receta {
  id_receta: number;
  nombre: string;
  descripcion: string | null;
  raciones_base: number;
  raciones_calculadas: number;
  ingredientes: IngredienteReceta[];
  se_puede_preparar: boolean;
  raciones_maximas: number;
}

export interface DespacharReceta {
  id_receta: number;
  raciones: number;
}

export interface IngredienteDescontado {
  id_insumo: number;
  insumo: string;
  cantidad: number;
  unidad_base: string;
}

export interface RespuestaDespacho extends RespuestaMensaje {
  ingredientes_descontados: IngredienteDescontado[];
}

export interface RecetaExterna {
  title: string;
  servings: string | null;
  ingredients: string[];
  instructions: string | null;
  pasos: string[];
  nutrition: Record<string, unknown> | string | null;
  nutrition_nota: string | null;
}

export interface RespuestaExternas {
  consulta: string;
  consulta_en: string;
  fuente: string;
  aviso?: string | null;
  total: number;
  recetas: RecetaExterna[];
}

// ---------------------------------------------------------------------------
// Kardex y reportes (HU-14)
// ---------------------------------------------------------------------------

export interface Movimiento {
  id_movimiento: number;
  codigo_correlativo: string;
  tipo_movimiento: TipoMovimiento;
  fecha_movimiento: string;
  id_insumo: number;
  insumo: string;
  unidad_base: string;
  id_lote: number | null;
  codigo_lote: string | null;
  cantidad: number;
  saldo_anterior: number;
  saldo_posterior: number;
  motivo: string | null;
  id_usuario: number;
  usuario: string;
}

export interface OllaResumenReporte {
  id_olla: number;
  codigo_unico: string;
  nombre: string;
  beneficiarios: number;
  atiende_hoy: boolean | null;
  activada: boolean;
  departamento: string;
  provincia: string;
  distrito: string;
}

export interface ResumenDonaciones {
  total: number;
  en_especie: number | null;
  monetarias: number | null;
  monto_total_soles: number;
  donantes_distintos: number;
}

export interface ResumenReporte {
  generado_en: string;
  periodo: { desde: string | null; hasta: string | null };
  olla: OllaResumenReporte | null;
  donaciones: ResumenDonaciones | null;
  movimientos_por_tipo: Record<TipoMovimiento, { cantidad_movimientos: number; cantidad_total: number }>;
  despachos: { total_despachos: number; raciones_servidas: number } | null;
  lotes_activos_por_semaforo: { VIGENTE: number; POR_VENCER: number; VENCIDO: number };
  insumos_stock_bajo: { id_insumo: number; insumo: string; stock_actual: number; stock_minimo: number; unidad_base: string }[];
  stock: StockInsumo[];
}

export interface DescargaCsv {
  blob: Blob;
  nombre: string;
}

// ---------------------------------------------------------------------------
// Administración (HU-14)
// ---------------------------------------------------------------------------

export interface UsuarioAdmin {
  id_usuario: number;
  nombre_completo: string;
  username: string;
  telefono: string;
  rol: Rol;
  activo: boolean;
  intentos_fallidos: number;
  bloqueado_hasta: string | null;
  bloqueado: boolean;
  fecha_creacion: string;
  id_olla: number | null;
  codigo_olla: string | null;
  nombre_olla: string | null;
  olla_activada: boolean | null;
}

export interface UsuarioAdminUpdate {
  activo?: boolean;
  nombre_completo?: string;
  telefono?: string;
  desbloquear?: boolean;
}

export interface RespuestaUsuario extends RespuestaMensaje {
  usuario: UsuarioAdmin;
}

export interface RespuestaOllaAdmin extends RespuestaMensaje {
  olla: OllaAdmin;
}
