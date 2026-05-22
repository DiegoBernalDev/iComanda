import { Linking, Platform } from 'react-native';

const PUBLIC_APP_BASE_URL = (process.env.EXPO_PUBLIC_APP_BASE_URL ?? 'https://icomanda.app').replace(/\/+$/, '');

export function getPublicMenuUrl(slug: string) {
  return `${PUBLIC_APP_BASE_URL}/menu/${slug}`;
}

export function getPublicTableUrl(slug: string, tableId: string) {
  return `${PUBLIC_APP_BASE_URL}/table/${slug}/${tableId}`;
}

export function getQrImageUrl(targetUrl: string, size = 320) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
}

export async function openExternalUrl(url: string) {
  await Linking.openURL(url);
}

export async function downloadQrImage(fileName: string, qrImageUrl: string) {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    try {
      const response = await fetch(qrImageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(objectUrl);
      return;
    } catch {
      // Fallback below opens the PNG in a new tab/native browser.
    }
  }

  await Linking.openURL(qrImageUrl);
}
