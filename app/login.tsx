import { Button, Enter, Surface, TextField } from "@/components/md3";
import { useAuth } from "@/context/auth";
import { useMD3Theme } from "@/hooks/use-md3-theme";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Completá todos los campos.");
      return;
    }
    setError("");
    setLoading(true);
    const { error: authError } = await signIn(
      email.trim().toLowerCase(),
      password,
    );
    if (authError) setError(authError);
    setLoading(false);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        style={s.scroll}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Marca */}
        <Enter delay={0} distance={16}>
          <View style={s.brand}>
            <Surface elevation="level3" style={s.logoSurface}>
              <Ionicons
                name="restaurant"
                size={36}
                color={colors.onPrimaryContainer}
              />
            </Surface>
            <Text
              style={[
                typography.headlineMedium,
                { color: colors.onBackground, marginTop: 16 },
              ]}
            >
              iComanda
            </Text>
            <Text
              style={[
                typography.bodyMedium,
                { color: colors.onSurfaceVariant, marginTop: 4 },
              ]}
            >
              Sistema de gestión de comandas
            </Text>
          </View>
        </Enter>

        {/* Card de login */}
        <Enter delay={120} distance={20}>
          <View
            style={[
              s.card,
              {
                borderRadius: shape.extraLarge,
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
          >
            <Text
              style={[
                typography.titleLarge,
                {
                  color: colors.onSurface,
                  marginBottom: 24,
                  textAlign: "center",
                },
              ]}
            >
              Iniciar sesión
            </Text>

            <TextField
              label="Correo electrónico"
              variant="outlined"
              value={email}
              onChangeText={setEmail}
              leadingIcon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              containerColor={colors.surfaceContainerLow}
            />

            <View style={{ marginTop: 16 }}>
              <TextField
                label="Contraseña"
                variant="outlined"
                value={password}
                onChangeText={setPassword}
                leadingIcon="lock-closed-outline"
                trailingIcon={showPassword ? "eye-outline" : "eye-off-outline"}
                onTrailingPress={() => setShowPassword((v) => !v)}
                secureTextEntry={!showPassword}
                error={error || undefined}
                containerColor={colors.surfaceContainerLow}
              />
            </View>

            <Button
              label={loading ? "Ingresando..." : "Ingresar"}
              onPress={handleLogin}
              variant="filled"
              icon="log-in-outline"
              disabled={loading}
              style={{ marginTop: 24, width: "100%" }}
            />

            {/* Roles info */}
            <View style={s.rolesRow}>
              <View
                style={[
                  s.rolePill,
                  {
                    backgroundColor: colors.primaryContainer,
                    borderRadius: shape.full,
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={colors.onPrimaryContainer}
                />
                <Text
                  style={[
                    typography.labelSmall,
                    { color: colors.onPrimaryContainer },
                  ]}
                >
                  Mesero
                </Text>
              </View>
              <View
                style={[
                  s.rolePill,
                  {
                    backgroundColor: colors.secondaryContainer,
                    borderRadius: shape.full,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={14}
                  color={colors.onSecondaryContainer}
                />
                <Text
                  style={[
                    typography.labelSmall,
                    { color: colors.onSecondaryContainer },
                  ]}
                >
                  Admin
                </Text>
              </View>
            </View>
          </View>
        </Enter>

        <Enter delay={280}>
          <Text
            style={[
              typography.bodySmall,
              {
                color: colors.onSurfaceVariant,
                textAlign: "center",
                marginTop: 24,
              },
            ]}
          >
            El acceso se asigna según tu rol en el sistema.
          </Text>
        </Enter>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (
  colors: ReturnType<typeof useMD3Theme>["colors"],
  shape: ReturnType<typeof useMD3Theme>["shape"],
) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    brand: { alignItems: "center", marginBottom: 32 },
    logoSurface: {
      width: 80,
      height: 80,
      borderRadius: shape.extraLarge,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryContainer,
    },
    card: { padding: 24, marginBottom: 8 },
    rolesRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginTop: 20,
    },
    rolePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
  });
