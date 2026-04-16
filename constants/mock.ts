// Mock data para Sprint 1 — reemplazar con Supabase en HU-02

export type Role = 'mesero' | 'admin';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  creadoEn: string;
}

export interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
}

export interface Restaurante {
  id: string;
  nombre: string;
  slug: string;
  direccion: string;
  telefono: string;
}

export const MOCK_USUARIO_SESION: Usuario = {
  id: 'u1',
  nombre: 'Carlos Mesero',
  email: 'carlos@icomanda.com',
  rol: 'mesero',
  activo: true,
  creadoEn: '2024-01-10',
};

export const MOCK_ADMIN_SESION: Usuario = {
  id: 'u0',
  nombre: 'Ana Admin',
  email: 'ana@icomanda.com',
  rol: 'admin',
  activo: true,
  creadoEn: '2024-01-01',
};

export const MOCK_USUARIOS: Usuario[] = [
  MOCK_ADMIN_SESION,
  MOCK_USUARIO_SESION,
  { id: 'u2', nombre: 'Luis Pérez',    email: 'luis@icomanda.com',  rol: 'mesero', activo: true,  creadoEn: '2024-02-05' },
  { id: 'u3', nombre: 'Sofía Ramos',   email: 'sofia@icomanda.com', rol: 'mesero', activo: false, creadoEn: '2024-03-12' },
  { id: 'u4', nombre: 'Jorge Méndez',  email: 'jorge@icomanda.com', rol: 'mesero', activo: true,  creadoEn: '2024-04-01' },
];

export const MOCK_MESAS: Mesa[] = [
  { id: 'm1', numero: 1,  capacidad: 2, activa: true  },
  { id: 'm2', numero: 2,  capacidad: 4, activa: true  },
  { id: 'm3', numero: 3,  capacidad: 4, activa: true  },
  { id: 'm4', numero: 4,  capacidad: 6, activa: true  },
  { id: 'm5', numero: 5,  capacidad: 2, activa: false },
  { id: 'm6', numero: 6,  capacidad: 8, activa: true  },
];

export const MOCK_RESTAURANTE: Restaurante = {
  id: 'r1',
  nombre: 'Restaurante El Buen Sabor',
  slug: 'el-buen-sabor',
  direccion: 'Av. Siempre Viva 742, La Paz',
  telefono: '+591 2 123 4567',
};
