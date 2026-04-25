import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Role = 'admin' | 'mesero' | null;

interface Profile {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
}

interface AuthContextValue {
  session:  Session | null;
  user:     User    | null;
  profile:  Profile | null;
  role:     Role;
  loading:  boolean;
  signIn:   (email: string, password: string) => Promise<{ error: string | null }>;
  signOut:  () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<Profile | null>(null);
  const [loading, setLoading]   = useState(true);

  // Carga el perfil del usuario desde la tabla profiles
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, email, rol, activo')
      .eq('id', userId)
      .single();

    if (!error && data) {
      const nextProfile = data as Profile;
      setProfile(nextProfile);
      return nextProfile;
    }

    setProfile(null);
    return null;
  };

  useEffect(() => {
    // Sesión inicial
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await fetchProfile(data.session.user.id);
      setLoading(false);
    });

    // Escucha cambios de auth (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        fetchProfile(newSession.user.id).finally(() => setLoading(false));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const nextProfile = await fetchProfile(data.user.id);
      if (!nextProfile) return { error: 'No se encontró el perfil del usuario.' };
      if (!nextProfile.activo) {
        await supabase.auth.signOut();
        setProfile(null);
        return { error: 'Tu usuario está inactivo. Contactá al administrador.' };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      session,
      user:    session?.user ?? null,
      profile,
      role:    profile?.rol ?? null,
      loading,
      signIn,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
