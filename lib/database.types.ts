// Generado automáticamente con: npx supabase gen types typescript --project-id vxvsymlyakezrbaubiap
// Actualizar cada vez que se modifique el schema en Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          rol: Database["public"]["Enums"]["rol_usuario"];
          activo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          email: string;
          rol?: Database["public"]["Enums"]["rol_usuario"];
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          rol?: Database["public"]["Enums"]["rol_usuario"];
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
          owner_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          slug: string;
          direccion?: string | null;
          telefono?: string | null;
          owner_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          slug?: string;
          direccion?: string | null;
          telefono?: string | null;
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
          id?: string;
          restaurant_id?: string;
          numero?: number;
          capacidad?: number;
          activa?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      menu_items: {
        Row: {
          id: string;
          restaurant_id: string;
          nombre: string;
          descripcion: string | null;
          precio: number;
          categoria: string | null;
          imagen_url: string | null;
          disponible: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          nombre: string;
          descripcion?: string | null;
          precio: number;
          categoria?: string | null;
          imagen_url?: string | null;
          disponible?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          nombre?: string;
          descripcion?: string | null;
          precio?: number;
          categoria?: string | null;
          imagen_url?: string | null;
          disponible?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          restaurant_id: string;
          table_id: string;
          mesero_id: string;
          estado: Database["public"]["Enums"]["estado_orden"];
          metodo_pago: Database["public"]["Enums"]["metodo_pago"] | null;
          pago_confirmado: boolean;
          total: number;
          created_at: string;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          table_id: string;
          mesero_id: string;
          estado?: Database["public"]["Enums"]["estado_orden"];
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"] | null;
          pago_confirmado?: boolean;
          total?: number;
          created_at?: string;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          table_id?: string;
          mesero_id?: string;
          estado?: Database["public"]["Enums"]["estado_orden"];
          metodo_pago?: Database["public"]["Enums"]["metodo_pago"] | null;
          pago_confirmado?: boolean;
          total?: number;
          created_at?: string;
          closed_at?: string | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          nombre: string;
          precio_unitario: number;
          cantidad: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          nombre: string;
          precio_unitario: number;
          cantidad?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          nombre?: string;
          precio_unitario?: number;
          cantidad?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          restaurant_id: string;
          descripcion: string;
          monto: number;
          fecha: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          descripcion: string;
          monto: number;
          fecha?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          descripcion?: string;
          monto?: number;
          fecha?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      table_calls: {
        Row: {
          id: string;
          table_id: string;
          restaurant_id: string;
          atendida: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          restaurant_id: string;
          atendida?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string;
          restaurant_id?: string;
          atendida?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_restaurant_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      rol_usuario: "mesero" | "admin";
      estado_orden: "activa" | "entregada" | "cancelada";
      metodo_pago: "efectivo" | "qr" | "tarjeta";
    };
  };
}
