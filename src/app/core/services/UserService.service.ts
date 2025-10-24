import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from 'src/app/core/config/api.config';
import { ApiService } from 'src/app/core/services/api.service';
import { ApiResponse } from 'src/app/shared/models/ApiResponse';
import { RegisterRequest } from 'src/app/shared/models/RegisterRequest';
import { User } from 'src/app/shared/models/User';
import { UserResponse } from 'src/app/shared/models/UserResponse';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private api: ApiService) {
    console.log('URL: ', API_CONFIG.endpoints.auth.register);
  }

  /**
   * Registrar nuevo usuario/cliente
   */
  register(userData: RegisterRequest): Observable<ApiResponse<UserResponse>> {
    return this.api.post<ApiResponse<UserResponse>>(
      API_CONFIG.endpoints.auth.register,
      userData
    );
  }

  /**
   * Obtener perfil de usuario por ID
   */
  getProfile(id: number): Observable<UserResponse> {
    return this.api.get<UserResponse>(API_CONFIG.endpoints.users.byId(id));
  }

  /**
   * Obtener usuario por ID (alias de getProfile)
   */
  getUserById(id: number): Observable<UserResponse> {
    return this.getProfile(id);
  }

  /**
   * Actualizar perfil de usuario
   */
  updateProfile(
    id: number,
    userData: RegisterRequest
  ): Observable<ApiResponse<UserResponse>> {
    return this.api.put<ApiResponse<UserResponse>>(
      API_CONFIG.endpoints.users.byId(id),
      userData
    );
  }






  /**
   * Obtener todos los usuarios (admin)
   */
  getAllUsers(): Observable<User[]> {
    return this.api.get<User[]>(API_CONFIG.endpoints.users.base);
  }

  createUser(user: User): Observable<ApiResponse<UserResponse>> {
    return this.api.post<ApiResponse<UserResponse>>(
      API_CONFIG.endpoints.auth.register,
      user
    );
  }

  // Actualizar usuario
  updateUser(id: number, user: any): Observable<ApiResponse<UserResponse>> {
    return this.api.put<ApiResponse<UserResponse>>(
      API_CONFIG.endpoints.users.byId(id),
      user
    );
  }

  // Cambiar estado de usuario (activar/desactivar)
  toggleUserStatus(id: number): Observable<ApiResponse<UserResponse>> {
    return this.api.patch<ApiResponse<UserResponse>>(
      `${API_CONFIG.endpoints.users.byId(id)}/toggle-status`,
      {}
    );
  }

  // Eliminar usuario
  deleteUser(id: number): Observable<ApiResponse<string>> {
    return this.api.delete<ApiResponse<string>>(
      API_CONFIG.endpoints.users.byId(id)
    );
  }

  // Cambiar contraseña
  changePassword(id: number, passwordData: { currentPassword: string, newPassword: string }): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(
      `${API_CONFIG.endpoints.users.byId(id)}/change-password`,
      passwordData
    );
  }
}
