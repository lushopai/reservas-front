export interface ClienteRequest {
  nombre: string;
  apellidos: string; // Cambiar a plural para coincidir con backend
  email: string;
  telefono: string;
  documento: string;
  tipoDocumento: string;
}
