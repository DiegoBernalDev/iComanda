import { Button, Card } from '@/components/md3';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { downloadQrImage, getQrImageUrl, openExternalUrl } from '@/lib/public-links';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle: string;
  targetUrl: string;
  downloadName: string;
};

export function QrPreviewCard({ title, subtitle, targetUrl, downloadName }: Props) {
  const { colors, typography, shape } = useMD3Theme();
  const styles = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const qrImageUrl = useMemo(() => getQrImageUrl(targetUrl), [targetUrl]);
  const [busy, setBusy] = useState<'open' | 'download' | null>(null);

  const handleOpen = async () => {
    setBusy('open');
    try {
      await openExternalUrl(targetUrl);
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    setBusy('download');
    try {
      await downloadQrImage(downloadName, qrImageUrl);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card variant="outlined" style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="qr-code-outline" size={16} color={colors.primary} />
        <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{title}</Text>
      </View>
      <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{subtitle}</Text>
      <View style={[styles.imageWrap, { borderRadius: shape.large, backgroundColor: colors.surfaceContainerHigh }]}> 
        <Image source={{ uri: qrImageUrl }} style={styles.image} contentFit="contain" />
      </View>
      <Text style={[typography.bodySmall, styles.url, { color: colors.onSurfaceVariant, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }]} numberOfLines={2}>
        {targetUrl}
      </Text>
      <View style={styles.actions}>
        <Button
          label={busy === 'open' ? 'Abriendo...' : 'Abrir enlace'}
          variant="outlined"
          icon="open-outline"
          onPress={handleOpen}
          disabled={busy !== null}
          style={{ flex: 1 }}
        />
        <Button
          label={busy === 'download' ? 'Preparando...' : 'Descargar PNG'}
          variant="filled"
          icon="download-outline"
          onPress={handleDownload}
          disabled={busy !== null}
          style={{ flex: 1.2 }}
        />
      </View>
    </Card>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  card: { padding: 16, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  imageWrap: { alignItems: 'center', justifyContent: 'center', padding: 18 },
  image: { width: 220, height: 220 },
  url: { lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8 },
});
