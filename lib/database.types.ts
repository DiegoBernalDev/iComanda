// Generado automáticamente con: npx supabase gen types typescript --project-id vxvsymlyakezrbaubiap
// Actualizar cada vez que se modifique el schema en Supabase

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables:    Record<string, never>;
    Views:     Record<string, never>;
    Functions: Record<string, never>;
    Enums:     Record<string, never>;
  };
}
