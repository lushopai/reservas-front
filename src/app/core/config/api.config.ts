import { environment } from "enviroments/environment";

export const API_CONFIG = {
  baseUrl: environment.apiUrl || 'http://localhost:8080',

  endpoints: {
    // Auth
    auth: {
      login: '/login',
      register: '/api/users/register',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
    },

    // Users (antes clientes)
    users: {
      base: '/api/users',
      register: '/api/users/register',
      byId: (id: number) => `/api/users/${id}`,
    },

    // Reservas
    reservas: {
      base: '/reservas',
      byId: (id: number) => `/reservas/${id}`,
      byUser: (userId: number) => `/reservas/user/${userId}`, // CAMBIADO
      confirmar: (id: number) => `/reservas/${id}/confirmar`,
      cancelar: (id: number) => `/reservas/${id}/cancelar`,
    },

    // Paquetes
    paquetes: {
      base: '/paquetes',
      byId: (id: number) => `/paquetes/${id}`,
      byUser: (userId: number) => `/paquetes/user/${userId}`, // CAMBIADO
      confirmar: (id: number) => `/paquetes/${id}/confirmar`,
    },

    // Cabañas
    cabanas: {
      base: '/cabanas',
      byId: (id: number) => `/cabanas/${id}`,
      disponibilidad: '/cabanas/disponibilidad',
    },

    // Servicios
    servicios: {
      base: '/servicios',
      byId: (id: number) => `/servicios/${id}`,
      disponibilidad: '/servicios/disponibilidad',
    },
  },
};
