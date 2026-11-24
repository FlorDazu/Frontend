import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth.guard';
import { PublicoLayout } from './features/publico/publico.layout';
import { PanelLayout } from './features/panel/panel.layout';

/**
 * Rutas de la aplicación.
 *
 * Las vistas se cargan de forma diferida (`loadComponent`) para que el
 * bundle inicial solo traiga el armazón público/privado y cada pantalla
 * baje su propio chunk al navegar hacia ella.
 */
export const routes: Routes = [
  // ---------------------------------------------------------------- portal público
  {
    path: '',
    component: PublicoLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/publico/landing/landing').then((m) => m.Landing),
        title: 'AYNI · Ollas comunes',
      },
      {
        path: 'nosotros',
        loadComponent: () => import('./features/publico/nosotros/nosotros').then((m) => m.Nosotros),
        title: 'Nosotros · AYNI',
      },
      {
        path: 'ollas',
        loadComponent: () =>
          import('./features/publico/ollas/ollas').then((m) => m.DirectorioOllas),
        title: 'Ollas comunes · AYNI',
      },
      {
        path: 'ollas/:id',
        loadComponent: () =>
          import('./features/publico/olla-detalle/olla-detalle').then((m) => m.OllaDetalle),
        title: 'Ficha de olla · AYNI',
      },
      {
        path: 'registrar-olla',
        loadComponent: () =>
          import('./features/publico/registro-publico/registro-publico').then((m) => m.RegistroPublico),
        title: 'Registrar olla · AYNI',
      },
      {
        path: 'contactanos',
        loadComponent: () =>
          import('./features/publico/contactanos/contactanos').then((m) => m.Contactanos),
        title: 'Contáctanos · AYNI',
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
        title: 'Iniciar sesión · AYNI',
      },
      {
        path: 'registro',
        loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
        title: 'Crear cuenta de dirigenta · AYNI',
      },
    ],
  },

  // ------------------------------------------------------------ panel de la dirigenta
  {
    path: 'panel',
    component: PanelLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['DIRIGENTA'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'mi-olla' },
      {
        path: 'mi-olla',
        loadComponent: () => import('./features/panel/mi-olla/mi-olla').then((m) => m.MiOlla),
        title: 'Mi olla · AYNI',
      },
      {
        path: 'inventario',
        loadComponent: () => import('./features/panel/inventario/inventario').then((m) => m.Inventario),
        title: 'Inventario PEPS · AYNI',
      },
      {
        path: 'donaciones',
        loadComponent: () =>
          import('./features/panel/donaciones/donaciones').then((m) => m.Donaciones),
        title: 'Donantes y donaciones · AYNI',
      },
      {
        path: 'recetas',
        loadComponent: () => import('./features/panel/recetas/recetas').then((m) => m.Recetas),
        title: 'Recetas y despacho · AYNI',
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/panel/reportes/reportes').then((m) => m.Reportes),
        title: 'Kardex y reportes · AYNI',
      },
    ],
  },

  // ------------------------------------------------------------- panel del administrador
  {
    path: 'admin',
    component: PanelLayout,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ollas' },
      {
        path: 'ollas',
        loadComponent: () =>
          import('./features/admin/ollas-admin/ollas-admin').then((m) => m.OllasAdmin),
        title: 'Gestión de ollas · AYNI',
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./features/admin/usuarios-admin/usuarios-admin').then((m) => m.UsuariosAdmin),
        title: 'Gestión de usuarios · AYNI',
      },
      {
        path: 'auditoria',
        loadComponent: () =>
          import('./features/admin/auditoria/auditoria').then((m) => m.Auditoria),
        title: 'Auditoría por olla · AYNI',
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
