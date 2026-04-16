import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useState, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/use-app-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const MOCK_CREDENTIALS = [
  { email: 'ana@icomanda.com',    password: '123456', rol: 'admin'  },
  { email: 'carlos@icomanda.com', password: '123456', rol: 'mesero' },
];

export default function LoginScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const buttonScale = useSharedValue(1);
  const animatedButton = useAnimatedStyle(() => ({ transform: [{ scale: buttonScale.value }] }));

  const handleLogin = async () => {
    if (!email || !password) { setError('Completá todos los campos.'); return; }
    setError('');
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      const usuario = MOCK_CREDENTIALS.find(
        (c) => c.email === email.trim().toLowerCase() && c.password === password
      );
      if (!usuario) { setError('Credenciales incorrectas.'); return; }
      router.replace(usuario.rol === 'admin' ? '/(admin)' : '/(mesero)');
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="restaurant" size={34} color="#fff" />
          </View>
          <Text style={styles.appName}>iComanda</Text>
          <Text style={styles.tagline}>Sistema de gestión de comandas</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar sesión</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={t.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="usuario@restaurante.com"
                placeholderTextColor={t.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={t.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={t.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={18} color={t.textMuted} />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={15} color={t.brand.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <AnimatedPressable
            style={[styles.button, animatedButton, loading && styles.buttonDisabled]}
            onPressIn={() => { buttonScale.value = withSpring(0.96); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Ingresar</Text>
              </>
            )}
          </AnimatedPressable>

          <View style={styles.rolesRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="person-outline" size={14} color={t.textTertiary} />
              <Text style={styles.roleBadgeText}>Mesero</Text>
            </View>
            <View style={styles.roleDivider} />
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={t.textTertiary} />
              <Text style={styles.roleBadgeText}>Admin</Text>
            </View>
          </View>
        </View>

        <View style={styles.devHint}>
          <Ionicons name="code-slash-outline" size={13} color={t.textMuted} />
          <Text style={styles.devHintText}>
            Admin: ana@icomanda.com · Mesero: carlos@icomanda.com{'\n'}Contraseña: 123456
          </Text>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    safe:      { flex: 1, backgroundColor: t.background },
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

    header:     { alignItems: 'center', marginBottom: 36 },
    logoCircle: {
      width: 72, height: 72, borderRadius: 36, backgroundColor: t.brand.primary,
      alignItems: 'center', justifyContent: 'center', marginBottom: 12,
      ...Platform.select({
        ios:     { shadowColor: t.brand.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 12 },
        android: { elevation: 10 },
      }),
    },
    appName:  { fontSize: 30, fontWeight: '700', color: t.text, letterSpacing: 0.5 },
    tagline:  { fontSize: 13, color: t.textMuted, marginTop: 4 },

    card: {
      width: '100%', backgroundColor: t.surface, borderRadius: 20,
      padding: 24, borderWidth: 1, borderColor: t.border,
      ...(t.shadow as object),
    },
    cardTitle: { fontSize: 18, fontWeight: '600', color: t.text, marginBottom: 20, textAlign: 'center' },

    inputGroup:   { marginBottom: 16 },
    label:        { fontSize: 13, fontWeight: '500', color: t.textTertiary, marginBottom: 6 },
    inputWrapper: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.surfaceInput, borderWidth: 1, borderColor: t.border, borderRadius: 12, paddingHorizontal: 12,
    },
    inputIcon:  { marginRight: 8 },
    input:      { paddingVertical: 13, fontSize: 15, color: t.text },
    eyeButton:  { paddingLeft: 8, paddingVertical: 13 },

    errorRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    errorText: { color: t.brand.danger, fontSize: 13 },

    button: {
      backgroundColor: t.brand.primary, borderRadius: 12, paddingVertical: 15,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
      ...Platform.select({
        ios:     { shadowColor: t.brand.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
        android: { elevation: 6 },
      }),
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText:     { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

    rolesRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 12 },
    roleBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.surfaceAlt, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: t.border },
    roleBadgeText: { fontSize: 13, color: t.textTertiary, fontWeight: '500' },
    roleDivider:   { width: 1, height: 20, backgroundColor: t.border },

    devHint:     { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: t.surface, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: t.border },
    devHintText: { fontSize: 11, color: t.textMuted, lineHeight: 17, flex: 1 },
  });
