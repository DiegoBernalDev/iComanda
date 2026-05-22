import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/auth';

function RootNavigator() {
  const { session, role, loading } = useAuth();
  const colorScheme = useColorScheme();
  const segments = useSegments();

  // HU-07: guards de navegación según rol
  useEffect(() => {
    if (loading) return;
    const firstSegment = String(segments[0] ?? '');
    const isPublicRoute = firstSegment === 'menu' || firstSegment === 'table';
    if (isPublicRoute) return;
    const inAdminGroup = firstSegment === '(admin)';
    const inMeseroGroup = firstSegment === '(mesero)';
    const inChefGroup = firstSegment === '(chef)';
    const onLogin = firstSegment === 'login';

    if (!session) {
      if (!onLogin) router.replace('/login');
      return;
    }

    if (role === 'admin' && !inAdminGroup) {
      router.replace('/(admin)');
      return;
    }

    if (role === 'mesero' && !inMeseroGroup) {
      router.replace('/(mesero)');
      return;
    }

    if (role === 'chef' && !inChefGroup) {
      router.replace('/(chef)');
      return;
    }

    // Sesión activa pero perfil aún no cargado — esperar
  }, [session, role, loading, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="login"    />
        <Stack.Screen name="menu/[slug]" />
        <Stack.Screen name="table/[slug]/[tableId]" />
        <Stack.Screen name="(mesero)" />
        <Stack.Screen name="(chef)" />
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
