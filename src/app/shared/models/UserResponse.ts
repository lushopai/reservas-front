export interface UserResponse {
  id: number;
  username?: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  email: string;
  telefono?: string;
  fechaRegistro: Date;
  ultimoAcceso?: Date;
  totalReservas?: number;
  enabled?: boolean;
}
