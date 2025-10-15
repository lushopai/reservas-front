export interface RecursoImagen {
  id?: number;
  recursoId?: number;
  url: string;
  nombre?: string;
  descripcion?: string;
  esPrincipal: boolean;
  ordenVisualizacion: number;
  fechaSubida?: string;
}
