import { ApplicationConfig } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { routes } from './app.routes'; // Importe as rotas aqui
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    // Garante a navegação inicial para renderizar a rota de login
    provideRouter(routes, withEnabledBlockingInitialNavigation()), // Aqui o Angular ativa o roteamento

    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations()
  ]
};
