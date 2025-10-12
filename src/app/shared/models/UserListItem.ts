import { Role } from "./Role";

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  roles: Role[];
  activo: boolean;
  fechaRegistro: Date;
}
