import { supabase } from '@/lib/supabase';

export interface AdminRestaurant {
  id: string;
  nombre: string;
  slug: string;
  direccion: string | null;
  telefono: string | null;
  logo_url: string | null;
  owner_id: string | null;
}

const ADMIN_RESTAURANT_SELECT = 'id, nombre, slug, direccion, telefono, logo_url, owner_id';

export async function getAdminRestaurant(userId?: string | null): Promise<AdminRestaurant | null> {
  if (userId) {
    const { data, error } = await supabase
      .from('restaurants')
      .select(ADMIN_RESTAURANT_SELECT)
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data) return data as AdminRestaurant;
  }

  const { data, error } = await supabase
    .from('restaurants')
    .select(ADMIN_RESTAURANT_SELECT)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as AdminRestaurant;
}
