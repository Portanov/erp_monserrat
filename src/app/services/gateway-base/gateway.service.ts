import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GatewayResponse, ApiErrorResponse } from '../../models/gateway/gateway.model';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class GatewayBaseService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Construye headers estándar
   * Si includeAuth es true, también agrega el token de autenticación si está disponible en localStorage
   * @param includeAuth indica si se debe incluir el token de autenticación en los headers (por defecto es true)
   * @return HttpHeaders con los headers configurados
   */
  private getHeaders(includeAuth: boolean = true): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    if (includeAuth) {
      const token = localStorage.getItem('access_token');
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  /**
   * Maneja errores del gateway
   * Si el error tiene un formato específico del gateway, extrae el mensaje; de lo contrario, devuelve un mensaje genérico
   * @return Observable que emite un error con el mensaje adecuado
   */
  private handleError(error: any): Observable<never> {
    if (error.error && error.error.intOpCode) {
      const apiError = error.error as ApiErrorResponse;
      const message = apiError.data?.message || `Error ${apiError.intOpCode}`;
      return throwError(() => new Error(message));
    }
    const message = error.message || 'Error de conexión con el gateway';
    return throwError(() => new Error(message));
  }

  /**
   * GET request
   * Este sirve para hacer la llamada GET al backend, se puede usar para obtener datos o para acciones que no requieren un cuerpo de solicitud
   * @param endpoint es la ruta a la que se dirige
   * @param params son los parámetros de consulta opcionales que se pueden incluir en la URL
   */
  protected get<T>(endpoint: string, params?: Record<string, any>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http
      .get<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params: httpParams,
      })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * POST request
   * Este sirve para hacer la llamada POST al backend, se puede usar para crear recursos o para acciones que requieren un cuerpo de solicitud
   * @param endpoint es la ruta a la que se dirige
   * @param body es el cuerpo de la solicitud, generalmente un objeto con los datos a enviar
   * @param includeAuth indica si se debe incluir el token de autenticación en los headers (por defecto es true)
   */
  protected post<T>(endpoint: string, body: any, includeAuth: boolean = true): Observable<T> {
    return this.http
      .post<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(includeAuth),
      })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * PUT request
   * Este sirve para hacer la llamada PUT al backend, se puede usar para actualizar recursos
   * @param endpoint es la ruta a la que se dirige
   * @param body es el cuerpo de la solicitud, generalmente un objeto con los datos a actualizar
   */
  protected put<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .put<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * DELETE request
   * Este sirve para hacer la llamada DELETE al backend, se puede usar para eliminar recursos
   * @param endpoint es la ruta a la que se dirige
   */
  protected delete<T>(endpoint: string): Observable<T> {
    return this.http
      .delete<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  /**
   * Valida que la respuesta tenga la estructura esperada
   * Si la respuesta no tiene un statusCode numérico, lanza un error indicando que el formato es inválido
   * @param response es la respuesta recibida del gateway
   * @return la misma respuesta si es válida, o lanza un error si no lo es
   */
  private validateResponse<T>(response: GatewayResponse<T>): GatewayResponse<T> {
    if (!response || typeof response.statusCode !== 'number') {
      throw new Error('Respuesta del gateway con formato inválido');
    }
    return response;
  }

  /**
   * PATCH request
   * Este sirve para hacer la llamada PATCH al backend, se puede usar para actualizar parcialmente recursos
   * @param endpoint es la ruta a la que se dirige
   * @param body es el cuerpo de la solicitud, generalmente un objeto con los datos a actualizar parcialmente
   * @returns Observable con los datos de la respuesta
   */
  protected patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http
      .patch<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError(this.handleError),
      );
  }

  // ========== MÉTODOS OPCIONALES (si necesitas la respuesta completa) ==========

  /**
   * GET request - Devuelve la respuesta COMPLETA (con statusCode, intOpCode)
   * Solo usar si necesitas información adicional del gateway
   * @param endpoint es la ruta a la que se dirige
   * @param params son los parámetros de consulta opcionales que se pueden incluir en la URL
   * @returns Observable con la respuesta completa del gateway
   */
  protected getFullResponse<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Observable<GatewayResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== undefined && params[key] !== null) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http
      .get<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params: httpParams,
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * POST request - Devuelve la respuesta COMPLETA
   * Solo usar si necesitas información adicional del gateway
   * @param endpoint es la ruta a la que se dirige
   * @param body es el cuerpo de la solicitud, generalmente un objeto con los datos a enviar
   * @param includeAuth indica si se debe incluir el token de autenticación en los headers (por defecto es true)
   * @returns Observable con la respuesta completa del gateway
   */
  protected postFullResponse<T>(
    endpoint: string,
    body: any,
    includeAuth: boolean = true,
  ): Observable<GatewayResponse<T>> {
    return this.http
      .post<GatewayResponse<T>>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders(includeAuth),
      })
      .pipe(catchError(this.handleError));
  }
}
