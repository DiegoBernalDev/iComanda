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
          id?: string;
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
          deprecated: boolean;
          last_cleared_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          numero: number;
          capacidad?: number;
          activa?: boolean;
          deprecated?: boolean;
          last_cleared_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          numero?: number;
          capacidad?: number;
          activa?: boolean;
          deprecated?: boolean;
          last_cleared_at?: string | null;
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
          agotado: boolean;
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
          agotado?: boolean;
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
          agotado?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          restaurant_id: string;
          nombre: string;
          unidad: string;
          stock_minimo: number;
          activo: boolean;
          created_at: string;
          current_stock?: number;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          nombre: string;
          unidad?: string;
          stock_minimo?: number;
          activo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          nombre?: string;
          unidad?: string;
          stock_minimo?: number;
          activo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      material_stock_movements: {
        Row: {
          id: string;
          material_id: string;
          restaurant_id: string;
          movement_type: Database["public"]["Enums"]["material_movement_type"];
          quantity: number;
          reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          restaurant_id: string;
          movement_type: Database["public"]["Enums"]["material_movement_type"];
          quantity: number;
          reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          material_id?: string;
          restaurant_id?: string;
          movement_type?: Database["public"]["Enums"]["material_movement_type"];
          quantity?: number;
          reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
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
          paid_at: string | null;
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
          paid_at?: string | null;
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
          paid_at?: string | null;
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
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          menu_item_id?: string | null;
          nombre: string;
          precio_unitario: number;
          cantidad?: number;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          menu_item_id?: string | null;
          nombre?: string;
          precio_unitario?: number;
          cantidad?: number;
          delivered_at?: string | null;
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
          atendida_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_id: string;
          restaurant_id: string;
          atendida?: boolean;
          atendida_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_id?: string;
          restaurant_id?: string;
          atendida?: boolean;
          atendida_at?: string | null;
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
      create_order_with_items: {
        Args: {
          p_restaurant_id: string;
          p_table_id: string;
          p_mesero_id: string;
          p_metodo_pago: Database["public"]["Enums"]["metodo_pago"];
          p_items: Json;
        };
        Returns: string;
      };
      append_order_items: {
        Args: {
          p_order_id: string;
          p_items: Json;
        };
        Returns: number;
      };
      clear_table_after_payment: {
        Args: {
          p_table_id: string;
        };
        Returns: void;
      };
      set_menu_item_sold_out: {
        Args: {
          p_menu_item_id: string;
          p_agotado: boolean;
        };
        Returns: void;
      };
      get_waiter_table_state_snapshot: {
        Args: {
          p_restaurant_id: string;
        };
        Returns: {
          id: string;
          numero: number;
          capacidad: number;
          activa: boolean;
          last_cleared_at: string | null;
          active_order_id: string | null;
          active_order_owner_id: string | null;
          active_order_estado: Database["public"]["Enums"]["estado_orden"] | null;
          active_order_created_at: string | null;
          latest_delivered_order_id: string | null;
          latest_delivered_closed_at: string | null;
          latest_delivered_pago_confirmado: boolean | null;
          active_call_id: string | null;
        }[];
      };
      get_report: {
        Args: {
          date_from: string;
          date_to: string;
        };
        Returns: Json;
      };
      get_top_items: {
        Args: {
          date_from: string;
          date_to: string;
          item_limit?: number;
        };
        Returns: {
          menu_item_id: string | null;
          name: string;
          total_qty: number;
          total_revenue: number;
        }[];
      };
      get_waiter_sales: {
        Args: {
          date_from: string;
          date_to: string;
        };
        Returns: {
          mesero_id: string;
          waiter_name: string;
          orders_count: number;
          total_sales: number;
        }[];
      };
      get_material_stock_snapshot: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: string;
          restaurant_id: string;
          nombre: string;
          unidad: string;
          stock_minimo: number;
          activo: boolean;
          created_at: string;
          current_stock: number;
        }[];
      };
      mark_table_call_attended: {
        Args: {
          p_call_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      material_movement_type: "consumo" | "reposicion";
      rol_usuario: "mesero" | "admin" | "chef";
      estado_orden: "activa" | "lista" | "entregada" | "cancelada";
      metodo_pago: "efectivo" | "qr" | "tarjeta";
    };
  };
}
