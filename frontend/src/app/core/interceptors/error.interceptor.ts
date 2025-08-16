import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';

        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          switch (error.status) {
            case 400:
              errorMessage = error.error?.message || 'Bad request';
              break;
            case 401:
              errorMessage = 'Unauthorized access';
              // Don't redirect here, let AuthInterceptor handle it
              break;
            case 403:
              errorMessage = 'Access forbidden';
              this.router.navigate(['/unauthorized']);
              break;
            case 404:
              errorMessage = 'Resource not found';
              break;
            case 422:
              errorMessage = error.error?.message || 'Validation failed';
              break;
            case 429:
              errorMessage = 'Too many requests. Please try again later.';
              break;
            case 500:
              errorMessage = 'Internal server error';
              break;
            case 502:
              errorMessage = 'Bad gateway';
              break;
            case 503:
              errorMessage = 'Service unavailable';
              break;
            case 504:
              errorMessage = 'Gateway timeout';
              break;
            default:
              errorMessage = error.error?.message || `Error ${error.status}`;
          }
        }

        // Log error for debugging
        console.error('HTTP Error:', {
          url: request.url,
          method: request.method,
          status: error.status,
          message: errorMessage,
          error: error
        });

        // You could also show a toast notification here
        // this.toastr.error(errorMessage);

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}