import { Role } from './Role';

export interface User {
  id?: any;
  username: string;
  password?: string; // Opcional

  // Datos del cliente (TODOS OPCIONALES ahora)
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  documento?: string;
  tipoDocumento?: string;
  fechaRegistro?: Date;

  // Auth
  roles?: Role[];
  enabled?: boolean;

  // Estadísticas
  totalReservas?: number;

   // Opcional: datos adicionales
  avatar?: string;
  direccion?: string;
  fechaNacimiento?: Date;

  // Helper
  nombreCompleto?: string;
}
