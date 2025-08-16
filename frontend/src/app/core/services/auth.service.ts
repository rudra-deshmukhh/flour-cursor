import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, LoginRequest, OtpRequest, ApiResponse } from '../../../../shared/types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private authStateSubject = new BehaviorSubject<User | null>(null);
  public authState$ = this.authStateSubject.asObservable();

  private tokenKey = 'flour_delivery_token';
  private refreshTokenKey = 'flour_delivery_refresh_token';

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  private initializeAuth() {
    const token = this.getToken();
    if (token) {
      this.validateToken(token).subscribe({
        next: (user) => {
          this.setCurrentUser(user);
        },
        error: () => {
          this.clearAuth();
        }
      });
    }
  }

  // Send OTP
  sendOTP(phoneNumber: string): Observable<{ userId: string; isNewUser: boolean }> {
    const request: OtpRequest = { phoneNumber };
    
    return this.http.post<ApiResponse<{ userId: string; isNewUser: boolean }>>(
      `${environment.apiUrl}/auth/send-otp`,
      request
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to send OTP');
      }),
      catchError(this.handleError)
    );
  }

  // Verify OTP and login
  verifyOTP(phoneNumber: string, otp: string): Observable<{ user: User; token: string; refreshToken: string }> {
    const request: LoginRequest = { phoneNumber, otp };
    
    return this.http.post<ApiResponse<{ user: User; token: string; refreshToken: string }>>(
      `${environment.apiUrl}/auth/verify-otp`,
      request
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const { user, token, refreshToken } = response.data;
          
          // Store tokens
          this.setToken(token);
          this.setRefreshToken(refreshToken);
          
          // Set current user
          this.setCurrentUser(user);
          
          return { user, token, refreshToken };
        }
        throw new Error(response.error || 'Invalid OTP');
      }),
      catchError(this.handleError)
    );
  }

  // Complete user profile
  completeProfile(userId: string, profileData: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  }): Observable<User> {
    return this.http.post<ApiResponse<User>>(
      `${environment.apiUrl}/auth/complete-profile`,
      { userId, ...profileData }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const user = response.data;
          this.setCurrentUser(user);
          return user;
        }
        throw new Error(response.error || 'Failed to complete profile');
      }),
      catchError(this.handleError)
    );
  }

  // Refresh token
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<ApiResponse<{ token: string }>>(
      `${environment.apiUrl}/auth/refresh-token`,
      { refreshToken }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          const newToken = response.data.token;
          this.setToken(newToken);
          return newToken;
        }
        throw new Error(response.error || 'Failed to refresh token');
      }),
      catchError(this.handleError)
    );
  }

  // Logout
  logout(): void {
    this.clearAuth();
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.currentUserSubject.value;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Check if user is flour mill
  isFlourMill(): boolean {
    return this.hasRole('flour_mill');
  }

  // Check if user is delivery partner
  isDeliveryPartner(): boolean {
    return this.hasRole('delivery_partner');
  }

  // Get token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Set token
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Get refresh token
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Set refresh token
  private setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  // Set current user
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
    this.authStateSubject.next(user);
  }

  // Clear authentication
  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.currentUserSubject.next(null);
    this.authStateSubject.next(null);
  }

  // Validate token
  private validateToken(token: string): Observable<User> {
    // In a real app, you might want to validate the token with the backend
    // For now, we'll decode the JWT and check if it's expired
    try {
      const payload = this.decodeJWT(token);
      if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
        // Token is valid, get user info
        return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/users/profile`).pipe(
          map(response => {
            if (response.success && response.data) {
              return response.data;
            }
            throw new Error('Failed to get user profile');
          })
        );
      } else {
        throw new Error('Token expired');
      }
    } catch (error) {
      return throwError(() => new Error('Invalid token'));
    }
  }

  // Decode JWT token
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  // Handle errors
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}