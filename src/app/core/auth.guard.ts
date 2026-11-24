import { inject } from '@angular/core';
import type { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

/**
 * authGuard: exige sesión activa. Si no hay usuario, redirige a /login
 * guardando la URL deseada en `returnUrl`.
 */
export const authGuard: CanActivateFn = (_ruta: ActivatedRouteSnapshot, estado: RouterStateSnapshot): boolean | UrlTree => {
  const auth = inject(AuthService);
  if (auth.usuario()) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: estado.url } });
};

/**
 * roleGuard: exige un rol permitido según `route.data.roles`
 * (p. ej. { roles: ['ADMIN'] }). Ante un rol distinto envía al usuario a su
 * panel por defecto según su rol.
 */
export const roleGuard: CanActivateFn = (ruta: ActivatedRouteSnapshot): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const usuario = auth.usuario();

  if (!usuario) return router.createUrlTree(['/login']);

  const roles = (ruta.data['roles'] as string[] | undefined) ?? [];
  if (roles.includes(usuario.rol)) return true;

  return router.createUrlTree([usuario.rol === 'ADMIN' ? '/admin/ollas' : '/panel/mi-olla']);
};
