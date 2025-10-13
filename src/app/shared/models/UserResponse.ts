export interface UserResponse {
  id: number;
  username?: string;
  nombre: string;
  apellidos: string; // Cambiar a plural para coincidir con backend
  documento: string;
  tipoDocumento: string;
  email: string;
  telefono?: string;
  fechaRegistro: Date;
  ultimoAcceso?: Date;
  totalReservas?: number;
  enabled?: boolean;
}
