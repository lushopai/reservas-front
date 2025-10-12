export interface UserResponse {
  id: number;
  nombre: string;
  apellido: string;
  documento:string;
  tipoDocumento:string;
  email: string;
  telefono?: string;
  fechaRegistro: Date;
  ultimoAcceso: Date;
}
