export interface RegisterRequest {
  nombre: string;
  apellidos: string;  // Plural para coincidir con modelo User en backend
  email: string;
  password: string;
  telefono: string;
  documento: string;
  tipoDocumento: string;
}
