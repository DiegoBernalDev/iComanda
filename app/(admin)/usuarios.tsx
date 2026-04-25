import { Button, Card, Chip, TextField, TopAppBar } from "@/components/md3";
import { useAuth } from "@/context/auth";
import { useMD3Theme } from "@/hooks/use-md3-theme";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "mesero" | "admin";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  creadoEn: string;
}

export default function UsuariosScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Role>("mesero");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargarUsuarios = async () => {
    setLoading(true);
    setError("");

    const { data, error: listError } = await supabase
      .from("profiles")
      .select("id, nombre, email, rol, activo, created_at")
      .order("created_at", { ascending: false });

    if (listError) {
      setError(listError.message);
      setLoading(false);
      return;
    }

    const nextUsuarios: Usuario[] = (data ?? []).map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      rol: row.rol,
      activo: Boolean(row.activo),
      creadoEn:
        typeof row.created_at === "string" ? row.created_at.slice(0, 10) : "",
    }));

    setUsuarios(nextUsuarios);
    setLoading(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const toggleActivo = async (id: string) => {
    const target = usuarios.find((u) => u.id === id);
    if (!target) return;

    if (id === user?.id && target.activo) {
      setError("No podés desactivar tu propio usuario desde esta cuenta.");
      return;
    }

    setError("");
    setSavingUserId(id);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ activo: !target.activo })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSavingUserId(null);
      return;
    }

    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? { ...u, activo: !u.activo } : u)),
    );
    setSavingUserId(null);
  };

  const crearUsuario = async () => {
    if (!nombre || !email || !password) {
      setError("Completá todos los campos.");
      return;
    }
    setError("");
    setCreating(true);

    const {
      data: { session: adminSessionBeforeCreate },
    } = await supabase.auth.getSession();

    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });
    if (authError || !data.user) {
      setError(authError?.message ?? "Error al crear usuario.");
      setCreating(false);
      return;
    }

    const {
      data: { session: sessionAfterSignUp },
    } = await supabase.auth.getSession();

    if (
      adminSessionBeforeCreate &&
      sessionAfterSignUp?.user?.id !== adminSessionBeforeCreate.user.id
    ) {
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: adminSessionBeforeCreate.access_token,
        refresh_token: adminSessionBeforeCreate.refresh_token,
      });

      if (restoreError) {
        setError(
          "Se creó el usuario en Auth, pero se perdió la sesión de admin. Iniciá sesión nuevamente.",
        );
        setCreating(false);
        return;
      }
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        nombre,
        email: email.trim().toLowerCase(),
        rol,
        activo: true,
      },
      { onConflict: "id" },
    );
    if (profileError) {
      setError(profileError.message);
      setCreating(false);
      return;
    }

    setNombre("");
    setEmail("");
    setPassword("");
    setRol("mesero");
    setModalVisible(false);
    await cargarUsuarios();
    setCreating(false);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Usuarios"
        onBack={() => router.back()}
        trailing={
          <Pressable
            onPress={() => setModalVisible(true)}
            style={[
              s.addBtn,
              {
                backgroundColor: colors.primaryContainer,
                borderRadius: shape.medium,
              },
            ]}
            android_ripple={{ color: colors.onPrimaryContainer + "30" }}
          >
            <Ionicons name="add" size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        }
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary chips */}
        <View style={s.chips}>
          <Chip label={`${usuarios.length} total`} icon="people-outline" />
          <Chip
            label={`${usuarios.filter((u) => u.activo).length} activos`}
            icon="checkmark-circle-outline"
            selected
          />
          <Chip
            label={`${usuarios.filter((u) => !u.activo).length} inactivos`}
            icon="close-circle-outline"
          />
        </View>

        {error ? (
          <View
            style={[
              s.errorBanner,
              {
                backgroundColor: colors.errorContainer,
                borderRadius: shape.small,
                marginBottom: 8,
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={14}
              color={colors.onErrorContainer}
            />
            <Text
              style={[
                typography.bodySmall,
                { color: colors.onErrorContainer, flex: 1 },
              ]}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={s.loaderWrap}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text
              style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}
            >
              Cargando usuarios...
            </Text>
          </View>
        ) : null}

        {/* Lista */}
        {!loading &&
          usuarios.map((u) => (
            <Card key={u.id} variant="elevated" style={s.userCard}>
              <View
                style={[
                  s.avatar,
                  {
                    backgroundColor:
                      u.rol === "admin"
                        ? colors.primaryContainer
                        : colors.secondaryContainer,
                    borderRadius: shape.medium,
                  },
                ]}
              >
                <Ionicons
                  name={
                    u.rol === "admin"
                      ? "shield-checkmark-outline"
                      : "person-outline"
                  }
                  size={22}
                  color={
                    u.rol === "admin"
                      ? colors.onPrimaryContainer
                      : colors.onSecondaryContainer
                  }
                />
              </View>
              <View style={s.userInfo}>
                <Text
                  style={[typography.titleSmall, { color: colors.onSurface }]}
                >
                  {u.nombre}
                </Text>
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {u.email}
                </Text>
                <View style={s.userMeta}>
                  <View
                    style={[
                      s.rolBadge,
                      {
                        backgroundColor:
                          u.rol === "admin"
                            ? colors.primaryContainer
                            : colors.secondaryContainer,
                        borderRadius: shape.full,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        typography.labelSmall,
                        {
                          color:
                            u.rol === "admin"
                              ? colors.onPrimaryContainer
                              : colors.onSecondaryContainer,
                        },
                      ]}
                    >
                      {u.rol}
                    </Text>
                  </View>
                  {!u.activo && (
                    <View
                      style={[
                        s.rolBadge,
                        {
                          backgroundColor: colors.errorContainer,
                          borderRadius: shape.full,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.labelSmall,
                          { color: colors.onErrorContainer },
                        ]}
                      >
                        inactivo
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable
                onPress={() => toggleActivo(u.id)}
                disabled={savingUserId === u.id}
                style={[
                  s.toggleBtn,
                  {
                    backgroundColor: u.activo
                      ? colors.tertiaryContainer
                      : colors.surfaceVariant,
                    borderRadius: shape.small,
                  },
                ]}
                android_ripple={{ color: colors.onSurface + "1F" }}
              >
                {savingUserId === u.id ? (
                  <ActivityIndicator
                    size="small"
                    color={
                      u.activo
                        ? colors.onTertiaryContainer
                        : colors.onSurfaceVariant
                    }
                  />
                ) : (
                  <Ionicons
                    name={u.activo ? "pause-outline" : "play-outline"}
                    size={18}
                    color={
                      u.activo
                        ? colors.onTertiaryContainer
                        : colors.onSurfaceVariant
                    }
                  />
                )}
              </Pressable>
            </Card>
          ))}
      </ScrollView>

      {/* Modal nuevo usuario */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View
            style={[
              s.modalCard,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderTopLeftRadius: shape.extraLarge,
                borderTopRightRadius: shape.extraLarge,
              },
            ]}
          >
            {/* Handle */}
            <View
              style={[
                s.handle,
                { backgroundColor: colors.onSurfaceVariant + "40" },
              ]}
            />

            <Text
              style={[
                typography.titleLarge,
                { color: colors.onSurface, marginBottom: 24 },
              ]}
            >
              Nuevo usuario
            </Text>

            <TextField
              label="Nombre completo"
              variant="outlined"
              value={nombre}
              onChangeText={setNombre}
              leadingIcon="person-outline"
            />
            <View style={{ marginTop: 16 }}>
              <TextField
                label="Correo electrónico"
                variant="outlined"
                value={email}
                onChangeText={setEmail}
                leadingIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={{ marginTop: 16 }}>
              <TextField
                label="Contraseña temporal"
                variant="outlined"
                value={password}
                onChangeText={setPassword}
                leadingIcon="lock-closed-outline"
                secureTextEntry
              />
            </View>

            <Text
              style={[
                typography.labelLarge,
                {
                  color: colors.onSurfaceVariant,
                  marginTop: 20,
                  marginBottom: 10,
                },
              ]}
            >
              Rol
            </Text>
            <View style={s.rolSelector}>
              {(["mesero", "admin"] as Role[]).map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRol(r)}
                  style={[
                    s.rolOption,
                    {
                      backgroundColor:
                        rol === r
                          ? colors.primaryContainer
                          : colors.surfaceVariant,
                      borderRadius: shape.medium,
                      borderWidth: rol === r ? 0 : 1,
                      borderColor: colors.outline,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      r === "admin"
                        ? "shield-checkmark-outline"
                        : "person-outline"
                    }
                    size={18}
                    color={
                      rol === r
                        ? colors.onPrimaryContainer
                        : colors.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      typography.labelLarge,
                      {
                        color:
                          rol === r
                            ? colors.onPrimaryContainer
                            : colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={s.modalActions}>
              <Button
                label="Cancelar"
                variant="text"
                onPress={() => {
                  setModalVisible(false);
                  setError("");
                }}
                style={{ flex: 1 }}
              />
              <Button
                label={creating ? "Creando..." : "Crear"}
                variant="filled"
                icon="person-add-outline"
                onPress={crearUsuario}
                disabled={creating}
                style={{ flex: 2 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, gap: 8, paddingBottom: 40 },

    chips: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 8 },

    userCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 16,
    },
    avatar: {
      width: 48,
      height: 48,
      alignItems: "center",
      justifyContent: "center",
    },
    userInfo: { flex: 1, gap: 4 },
    userMeta: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    rolBadge: { paddingHorizontal: 10, paddingVertical: 2 },
    toggleBtn: { padding: 10 },

    addBtn: { padding: 8 },

    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 10,
      marginTop: 12,
    },
    loaderWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "#00000055",
      justifyContent: "flex-end",
    },
    modalCard: { padding: 24, paddingTop: 12 },
    handle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: 20,
    },
    rolSelector: { flexDirection: "row", gap: 10 },
    rolOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
    },
    modalActions: { flexDirection: "row", gap: 8, marginTop: 24 },
  });
