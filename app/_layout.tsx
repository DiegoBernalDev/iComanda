import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/auth';

function RootNavigator() {
  const { session, role, loading } = useAuth();
  const colorScheme = useColorScheme();

  // HU-07: guards de navegación según rol
  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/login');
      return;
    }

    if (role === 'admin')  { router.replace('/(admin)');  return; }
    if (role === 'mesero') { router.replace('/(mesero)'); return; }

    // Sesión activa pero perfil aún no cargado — esperar
  }, [session, role, loading]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="login"    />
        <Stack.Screen name="(mesero)" />
        <Stack.Screen name="(admin)"  />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
