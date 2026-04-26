import { Stack } from 'expo-router';

export default function MeseroLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0F0F0F' },
      }}
    />
  );
}
