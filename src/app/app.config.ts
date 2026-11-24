import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './core/auth.interceptor';
import { AuthService } from './core/services/auth.service';
import { TamanoLetraService } from './core/tamano-letra.service';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // Cliente HTTP con el interceptor funcional (token, 401 y `detail`).
    provideHttpClient(withInterceptors([authInterceptor])),
    // Restaura la sesión (GET /api/auth/me) antes de la primera navegación,
    // de modo que los guards siempre vean el usuario resuelto.
    // También se aplica aquí el tamaño de letra guardado (WCAG 2.1) para que
    // la preferencia rija tanto el portal público como los paneles privados.
    provideAppInitializer(() => {
      inject(TamanoLetraService);
      return inject(AuthService).restaurarSesion();
    }),
  ],
};
