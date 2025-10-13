export enum CategoriaInventario {
  MUEBLES = 'MUEBLES',
  ELECTRODOMESTICOS = 'ELECTRODOMESTICOS',
  ELECTRONICA = 'ELECTRONICA',
  ROPA_CAMA = 'ROPA_CAMA',
  MENAJE = 'MENAJE',
  DECORACION = 'DECORACION',
  HERRAMIENTAS = 'HERRAMIENTAS',
  EQUIPAMIENTO_DEPORTIVO = 'EQUIPAMIENTO_DEPORTIVO',
  OTROS = 'OTROS'
}

export enum EstadoItem {
  DISPONIBLE = 'DISPONIBLE',
  EN_USO = 'EN_USO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  DANADO = 'DANADO',
  FUERA_SERVICIO = 'FUERA_SERVICIO'
}

export interface ItemInventario {
  id: number;
  recursoId: number;
  nombreRecurso: string;
  nombre: string;
  categoria: CategoriaInventario;
  cantidadTotal: number;
  cantidadDisponible?: number;
  estadoItem: EstadoItem;
  esReservable: boolean;
  precioReserva: number;
}

export interface ItemInventarioRequest {
  recursoId: number;
  nombre: string;
  categoria: CategoriaInventario;
  cantidadTotal: number;
  estadoItem: EstadoItem;
  esReservable: boolean;
  precioReserva: number;
}
