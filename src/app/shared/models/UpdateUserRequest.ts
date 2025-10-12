import { TipoDocumento } from "../enum/TipoDocumento";
import { Role } from "./Role";

export interface UpdateUserRequest {
  email?: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  documento?: string;
  tipoDocumento?: TipoDocumento;
  activo?: boolean;
  roles?: Role[];
}
