import { useAuth } from '@/context/auth';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type BannerMessage = { id: string; text: string } | null;

export default function MeseroLayout() {
  const { colors, typography, shape } = useMD3Theme();
  const styles = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();
  const [banner, setBanner] = useState<BannerMessage>(null);

  useEffect(() => {
    if (!user?.id) return;

    let dismissTimer: ReturnType<typeof setTimeout> | null = null;
    const show = (text: string) => {
      setBanner({ id: `${Date.now()}`, text });
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = setTimeout(() => setBanner(null), 4500);
    };

    const ordersChannel = supabase
      .channel(`waiter-notify-orders-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `mesero_id=eq.${user.id}`,
        },
        async (payload) => {
          const next = payload.new as { estado?: string; table_id?: string };
          if (next.estado !== 'lista' || !next.table_id) return;

          const { data: table } = await supabase
            .from('tables')
            .select('numero')
            .eq('id', next.table_id)
            .maybeSingle();

          show(`Pedido listo para entregar en Mesa ${table?.numero ?? '?'}`);
        },
      )
      .subscribe();

    const callsChannel = supabase
      .channel(`waiter-notify-calls-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'table_calls',
        },
        async (payload) => {
          const next = payload.new as { table_id?: string };
          if (!next.table_id) return;

          const { data: table } = await supabase
            .from('tables')
            .select('numero')
            .eq('id', next.table_id)
            .maybeSingle();

          show(`Cliente llamando en Mesa ${table?.numero ?? '?'}`);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(callsChannel);
      if (dismissTimer) clearTimeout(dismissTimer);
    };
  }, [user?.id]);

  return (
    <View style={styles.root}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#0F0F0F' },
        }}
      />
      {banner ? (
        <View style={[styles.banner, { backgroundColor: colors.primaryContainer, borderRadius: shape.medium }]}>
          <Ionicons name="notifications-outline" size={18} color={colors.onPrimaryContainer} />
          <Text style={[typography.bodyMedium, { color: colors.onPrimaryContainer, flex: 1 }]}>{banner.text}</Text>
        </View>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    root: { flex: 1 },
    banner: {
      position: 'absolute',
      top: 48,
      left: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
      paddingHorizontal: 12,
      paddingVertical: 10,
      elevation: 8,
    },
  });

