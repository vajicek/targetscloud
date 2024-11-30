import {
  ApplicationConfig,
  provideZoneChangeDetection,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptorsFromDi
} from "@angular/common/http";
import {
  HttpClient,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import {
  JwtHelperService,
  JWT_OPTIONS
} from '@auth0/angular-jwt';
import { firstValueFrom } from 'rxjs';

import { AuthInterceptorService } from './services/auth-interceptor.service';
import { routes } from './app.routes';
import { environment } from '../environments/environment';

function loadConfig(http: HttpClient) {
  return () => firstValueFrom(http.get('/assets/config.json'))
    .then(config => {
      Object.assign(environment, config);
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: JWT_OPTIONS,
      useValue: JWT_OPTIONS
    },
    JwtHelperService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptorService,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: loadConfig,
      deps: [HttpClient],
      multi: true
    }
  ]
};
