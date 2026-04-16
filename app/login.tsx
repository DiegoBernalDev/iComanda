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
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// Credenciales mock — reemplazar con Supabase en HU-06
const MOCK_CREDENTIALS = [
  { email: 'ana@icomanda.com',    password: '123456', rol: 'admin'  },
  { email: 'carlos@icomanda.com', password: '123456', rol: 'mesero' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const buttonScale = useSharedValue(1);
  const animatedButton = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completá todos los campos.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      // TODO HU-06: reemplazar con supabase.auth.signInWithPassword({ email, password })
      const usuario = MOCK_CREDENTIALS.find(
        (c) => c.email === email.trim().toLowerCase() && c.password === password
      );
      if (!usuario) {
        setError('Credenciales incorrectas.');
        return;
      }
      router.replace(usuario.rol === 'admin' ? '/(admin)' : '/(mesero)');
    } catch {
      setError('Ocurrió un error. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
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

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="usuario@restaurante.com"
                placeholderTextColor="#4B5563"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Contraseña */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.inputFlex]}
                placeholder="••••••••"
                placeholderTextColor="#4B5563"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={18}
                  color="#6B7280"
                />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Botón animado */}
          <AnimatedPressable
            style={[styles.button, animatedButton, loading && styles.buttonDisabled]}
            onPressIn={() => { buttonScale.value = withSpring(0.96); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Ingresar</Text>
              </>
            )}
          </AnimatedPressable>

          {/* Badges de roles */}
          <View style={styles.rolesRow}>
            <View style={styles.roleBadge}>
              <Ionicons name="person-outline" size={14} color="#9CA3AF" />
              <Text style={styles.roleBadgeText}>Mesero</Text>
            </View>
            <View style={styles.roleDivider} />
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#9CA3AF" />
              <Text style={styles.roleBadgeText}>Admin</Text>
            </View>
          </View>
        </View>

        <View style={styles.devHint}>
          <Ionicons name="code-slash-outline" size={13} color="#4B5563" />
          <Text style={styles.devHintText}>
            Admin: ana@icomanda.com · Mesero: carlos@icomanda.com{'\n'}Contraseña: 123456
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E85D04',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#E85D04',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
      android: { elevation: 10 },
    }),
  },
  appName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  // Card
  card: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: { elevation: 10 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F3F4F6',
    marginBottom: 20,
    textAlign: 'center',
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#F3F4F6',
  },
  inputFlex: {
    flex: 1,
  },
  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 13,
  },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
  },

  // Botón
  button: {
    backgroundColor: '#E85D04',
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#E85D04',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Badges de roles
  rolesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#262626',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  roleBadgeText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  roleDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#333333',
  },

  // Dev hint
  devHint: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  devHintText: {
    fontSize: 11,
    color: '#4B5563',
    lineHeight: 17,
    flex: 1,
  },
});
