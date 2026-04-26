// Generado automáticamente con: npx supabase gen types typescript --project-id vxvsymlyakezrbaubiap
// Actualizar cada vez que se modifique el schema en Supabase

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          rol: 'mesero' | 'admin';
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          email: string;
          rol?: 'mesero' | 'admin';
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          email?: string;
          rol?: 'mesero' | 'admin';
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      restaurants: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          direccion: string | null;
          telefono: string | null;
          logo_url: string | null;
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          slug: string;
          direccion?: string | null;
          telefono?: string | null;
          logo_url?: string | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          nombre?: string;
          slug?: string;
          direccion?: string | null;
          telefono?: string | null;
          logo_url?: string | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      tables: {
        Row: {
          id: string;
          restaurant_id: string;
          numero: number;
          capacidad: number;
          activa: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          numero: number;
          capacidad?: number;
          activa?: boolean;
          created_at?: string;
        };
        Update: {
          restaurant_id?: string;
          numero?: number;
          capacidad?: number;
          activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views:     Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      rol_usuario: 'mesero' | 'admin';
      estado_orden: 'activa' | 'entregada' | 'cancelada';
      metodo_pago: 'efectivo' | 'qr' | 'tarjeta';
    };
    CompositeTypes: Record<string, never>;
  };
}
