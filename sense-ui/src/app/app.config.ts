import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { environment } from '../environments/environment';
import { EndeavorHttpRepository } from './core/repositories/endeavor-http-repository';
import { EndeavorLocalRepository } from './core/repositories/endeavor-local-repository';
import { EndeavorRepository } from './core/repositories/endeavor-repository';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    {
      provide: EndeavorRepository,
      useClass: environment.apiBaseUrl ? EndeavorHttpRepository : EndeavorLocalRepository,
    },
  ],
};
