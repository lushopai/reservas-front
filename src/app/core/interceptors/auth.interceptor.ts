import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private storage: StorageService,
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Agregar token si existe
    const token = this.storage.getToken();

    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si es 401, hacer logout
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/']);
        }

        // Si es 403, redirigir a acceso denegado
        if (error.status === 403) {
          this.router.navigate(['/acceso-denegado']);
        }

        return throwError(() => error);
      })
    );
  }
}
