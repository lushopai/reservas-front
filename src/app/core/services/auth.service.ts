import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from 'src/app/shared/models/User';
import { StorageService } from './storage.service';
import { Router } from '@angular/router';
import { LoginRequest } from 'src/app/shared/models/LoginRequest';
import { API_CONFIG } from '../config/api.config';
import { LoginResponse } from 'src/app/shared/models/LoginResponse';
import { jwtDecode } from 'jwt-decode';
import { Role } from 'src/app/shared/models/Role';

export interface JwtPayload {
  sub: string; // username
  userId: number;
  email?: string;
  roles: string[];
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private router: Router
  ) {
    // Cargar usuario al iniciar
    const user = this.storage.getUser();
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.login}`;

    return this.http.post<LoginResponse>(url, credentials).pipe(
      tap((response: any) => {
        console.log('response service: ', response);
        // Guardar token
        this.storage.saveToken(response.token);

        // Decodificar token para obtener info del usuario
        const decodedToken: JwtPayload = jwtDecode(response.token);

        console.log('Decoded token:', decodedToken);

        // Parsear roles del token
        let roles: Role[] = [];

        if (decodedToken.roles && Array.isArray(decodedToken.roles)) {
          // Si los roles vienen como array de strings ["ROLE_USER", "ROLE_ADMIN"]
          roles = decodedToken.roles.map((roleName, index) => ({
            id: index + 1,
            name: roleName
          }));
        }

        // Crear objeto user que coincida con la interfaz User
        const user: User = {
          id: decodedToken.userId,
          username: decodedToken.sub,
          email: decodedToken.email || decodedToken.sub,
          roles: roles,
          enabled: true,
        };

        console.log('User object created:', user);

        // Guardar usuario
        this.storage.saveUser(user);
        this.currentUserSubject.next(user);
      })
    );
  }

  register(cliente: any): Observable<any> {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.auth.register}`;
    return this.http.post(url, cliente);
  }

  logout(): void {
    this.storage.clear();
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    return this.storage.isAuthenticated();
  }

  getCurrentUser(): User | null {
    console.log('getCurrentUser called');
    const user = this.currentUserSubject.value;
    console.log('User data:', user);
    return user;
  }
  /**
   * Obtener ID del usuario actual
   */
  getCurrentUserId(): number | null {
    return this.currentUserSubject.value?.id || null;
  }

  isAdmin(): boolean {
    return this.hasRole('ROLE_ADMIN');
  }

  private redirectByRole(user: User): void {
    const isAdmin = user.roles?.some((role) => {
      if (typeof role === 'string') {
        return role === 'ROLE_ADMIN';
      }
      return role.name === 'ROLE_ADMIN';
    });

    if (isAdmin) {
      this.router
        .navigate(['/admin/dashboard'])
        .then(() => console.log('Navegación exitosa a admin dashboard'))
        .catch((err) => console.error('Error en navegación:', err));
    } else {
      this.router
        .navigate(['/cliente/mis-reservas'])
        .then(() => console.log('Navegación exitosa a cliente'))
        .catch((err) => console.error('Error en navegación:', err));
    }
  }

  /**
   * Refrescar información del usuario desde el backend
   */
  refreshUser(): Observable<User> {
    const userId = this.getCurrentUserId();

    if (!userId) {
      throw new Error('No hay usuario autenticado');
    }

    const url = `${API_CONFIG.baseUrl}/users/${userId}`;

    return this.http.get<User>(url).pipe(
      tap((user) => {
        // Mantener roles del token
        const currentUser = this.getCurrentUser();
        if (currentUser?.roles) {
          user.roles = currentUser.roles;
        }

        this.updateCurrentUser(user);
      })
    );
  }
  /**
   * Actualizar usuario en memoria
   */
  updateCurrentUser(user: User): void {
    this.storage.saveUser(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Obtener token
   */
  getToken(): string | null {
    return this.storage.getToken();
  }



  /**
   * Verificar si tiene un rol específico
   */
  hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    if (!user?.roles) return false;

    return user.roles.some((role) => {
      // Manejar tanto objetos Role como strings
      if (typeof role === 'string') {
        return role === roleName;
      }
      return role.name === roleName;
    });
  }
}
