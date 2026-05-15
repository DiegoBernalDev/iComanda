import { Button } from '@/components/md3';
import { supabasePublic } from '@/lib/supabase-public';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  tableId: string;
  restaurantId: string;
  colors: any;
  typography: any;
};

const COOLDOWN_SECONDS = 60;

export function CallWaiterButton({ tableId, restaurantId, colors, typography }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [nextCallAt, setNextCallAt] = useState<number>(0);

  const remaining = useMemo(() => {
    const diff = Math.ceil((nextCallAt - Date.now()) / 1000);
    return Math.max(diff, 0);
  }, [nextCallAt]);

  const onCall = async () => {
    if (loading || remaining > 0) return;

    setLoading(true);
    setMessage('');
    const { error } = await supabasePublic
      .from('table_calls')
      .insert({ table_id: tableId, restaurant_id: restaurantId, atendida: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setNextCallAt(Date.now() + COOLDOWN_SECONDS * 1000);
    setMessage('Tu mesero está en camino.');
    setLoading(false);
  };

  return (
    <View style={s.wrap}>
      <Button
        onPress={onCall}
        disabled={loading || remaining > 0}
        label={remaining > 0 ? `Llamar nuevamente en ${remaining}s` : 'Llamar al mesero'}
      />
      {message ? (
        <Text style={[typography.bodySmall, { color: message.includes('camino') ? colors.primary : colors.error }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 8 },
});

