import { Button, Card, Surface, TextField, TopAppBar } from "@/components/md3";
import { useAuth } from "@/context/auth";
import { useMD3Theme } from "@/hooks/use-md3-theme";
import { AdminRestaurant, getAdminRestaurant } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface RestauranteForm {
  nombre: string;
  slug: string;
  direccion: string;
  telefono: string;
}

export default function RestauranteScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [restaurante, setRestaurante] = useState<AdminRestaurant | null>(null);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState<RestauranteForm>({
    nombre: "",
    slug: "",
    direccion: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);

  const fillForm = (nextRestaurant: AdminRestaurant) => {
    setForm({
      nombre: nextRestaurant.nombre,
      slug: nextRestaurant.slug,
      direccion: nextRestaurant.direccion ?? "",
      telefono: nextRestaurant.telefono ?? "",
    });
  };

  useEffect(() => {
    const loadRestaurant = async () => {
      setLoading(true);
      setError("");

      const nextRestaurant = await getAdminRestaurant(user?.id ?? null);
      if (!nextRestaurant) {
        setError("No se encontró un restaurante para administrar.");
        setRestaurante(null);
        setLoading(false);
        return;
      }

      setRestaurante(nextRestaurant);
      fillForm(nextRestaurant);
      setLoading(false);
    };

    loadRestaurant();
  }, [user?.id]);

  const iniciarEdicion = () => {
    if (!restaurante) return;
    fillForm(restaurante);
    setEditando(true);
    setGuardado(false);
    setError("");
  };

  const guardar = async () => {
    if (!restaurante) return;

    const nombre = form.nombre.trim();
    const slug = form.slug.trim().toLowerCase();
    if (!nombre || !slug) {
      setError("Nombre y slug son obligatorios.");
      return;
    }

    setSaving(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("restaurants")
      .update({
        nombre,
        slug,
        direccion: form.direccion.trim() || null,
        telefono: form.telefono.trim() || null,
      })
      .eq("id", restaurante.id)
      .select("id, nombre, slug, direccion, telefono, owner_id")
      .single();

    if (updateError || !data) {
      setError(updateError?.message ?? "No se pudo guardar el restaurante.");
      setSaving(false);
      return;
    }

    const nextRestaurant = data as AdminRestaurant;
    setRestaurante(nextRestaurant);
    fillForm(nextRestaurant);
    setSaving(false);
    setEditando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const cancelar = () => {
    if (restaurante) fillForm(restaurante);
    setEditando(false);
    setError("");
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Restaurante"
        onBack={() => router.back()}
        trailing={
          !editando ? (
            <Pressable
              onPress={iniciarEdicion}
              disabled={!restaurante || loading}
              style={[
                s.editBtn,
                {
                  backgroundColor: colors.secondaryContainer,
                  borderRadius: shape.medium,
                },
              ]}
              android_ripple={{ color: colors.onSecondaryContainer + "30" }}
            >
              <Ionicons
                name="create-outline"
                size={20}
                color={colors.onSecondaryContainer}
              />
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )
        }
      />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <View
            style={[
              s.errorBanner,
              {
                backgroundColor: colors.errorContainer,
                borderRadius: shape.medium,
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={16}
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
              Cargando restaurante...
            </Text>
          </View>
        ) : null}

        {/* Banner */}
        <Surface
          elevation="level2"
          style={[s.banner, { borderRadius: shape.extraLarge }]}
        >
          <View
            style={[
              s.bannerIcon,
              {
                backgroundColor: colors.primaryContainer,
                borderRadius: shape.large,
              },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={36}
              color={colors.onPrimaryContainer}
            />
          </View>
          <Text
            style={[
              typography.headlineSmall,
              { color: colors.onSurface, marginTop: 8, textAlign: "center" },
            ]}
          >
            {restaurante?.nombre ?? "Sin restaurante"}
          </Text>
          <View
            style={[
              s.slugPill,
              {
                backgroundColor: colors.surfaceVariant,
                borderRadius: shape.full,
              },
            ]}
          >
            <Ionicons
              name="link-outline"
              size={12}
              color={colors.onSurfaceVariant}
            />
            <Text
              style={[
                typography.labelMedium,
                {
                  color: colors.onSurfaceVariant,
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                },
              ]}
            >
              /{restaurante?.slug ?? "sin-slug"}
            </Text>
          </View>
        </Surface>

        {/* Success banner */}
        {guardado && (
          <View
            style={[
              s.successBanner,
              {
                backgroundColor: colors.tertiaryContainer,
                borderRadius: shape.medium,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={colors.onTertiaryContainer}
            />
            <Text
              style={[
                typography.bodySmall,
                { color: colors.onTertiaryContainer },
              ]}
            >
              Cambios guardados correctamente
            </Text>
          </View>
        )}

        {/* Info card */}
        <Text
          style={[
            typography.titleMedium,
            { color: colors.onSurface, marginBottom: 12 },
          ]}
        >
          Información general
        </Text>

        {editando && restaurante ? (
          <View style={s.fieldsEdit}>
            <TextField
              label="Nombre"
              variant="outlined"
              value={form.nombre}
              onChangeText={(v) => setForm((f) => ({ ...f, nombre: v }))}
              leadingIcon="storefront-outline"
            />
            <TextField
              label="Slug"
              variant="outlined"
              value={form.slug}
              onChangeText={(v) =>
                setForm((f) => ({
                  ...f,
                  slug: v.toLowerCase().replace(/\s/g, "-"),
                }))
              }
              leadingIcon="link-outline"
              supportingText="Solo letras, números y guiones"
            />
            <TextField
              label="Dirección"
              variant="outlined"
              value={form.direccion}
              onChangeText={(v) => setForm((f) => ({ ...f, direccion: v }))}
              leadingIcon="location-outline"
            />
            <TextField
              label="Teléfono"
              variant="outlined"
              value={form.telefono}
              onChangeText={(v) => setForm((f) => ({ ...f, telefono: v }))}
              leadingIcon="call-outline"
              keyboardType="phone-pad"
            />
          </View>
        ) : (
          <Card variant="outlined" style={{ padding: 0, overflow: "hidden" }}>
            {[
              {
                icon: "storefront-outline" as const,
                label: "Nombre",
                value: restaurante?.nombre ?? "-",
              },
              {
                icon: "link-outline" as const,
                label: "Slug",
                value: `/${restaurante?.slug ?? "-"}`,
              },
              {
                icon: "location-outline" as const,
                label: "Dirección",
                value: restaurante?.direccion ?? "-",
              },
              {
                icon: "call-outline" as const,
                label: "Teléfono",
                value: restaurante?.telefono ?? "-",
              },
            ].map((row, i, arr) => (
              <View
                key={row.label}
                style={[
                  s.infoRow,
                  i < arr.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
              >
                <Ionicons
                  name={row.icon}
                  size={16}
                  color={colors.onSurfaceVariant}
                  style={{ width: 24 }}
                />
                <Text
                  style={[
                    typography.bodySmall,
                    { color: colors.onSurfaceVariant, width: 76 },
                  ]}
                >
                  {row.label}
                </Text>
                <Text
                  style={[
                    typography.bodyMedium,
                    { color: colors.onSurface, flex: 1 },
                  ]}
                  numberOfLines={1}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </Card>
        )}

        {/* URL preview */}
        <Card
          variant="filled"
          style={[s.previewCard, { borderRadius: shape.large }]}
        >
          <View style={s.previewHeader}>
            <Ionicons
              name="globe-outline"
              size={16}
              color={colors.onSurfaceVariant}
            />
            <Text
              style={[
                typography.labelLarge,
                { color: colors.onSurfaceVariant },
              ]}
            >
              URL carta pública
            </Text>
          </View>
          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.onSurface,
                fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                marginTop: 6,
              },
            ]}
          >
            icomanda.app/
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {editando ? form.slug : (restaurante?.slug ?? "sin-slug")}
            </Text>
          </Text>
          <Text
            style={[
              typography.bodySmall,
              { color: colors.onSurfaceVariant, marginTop: 4 },
            ]}
          >
            Disponible tras configurar el QR en Sprint 3
          </Text>
        </Card>

        {/* Edit actions */}
        {editando && (
          <View style={s.editActions}>
            <Button
              label="Cancelar"
              variant="outlined"
              onPress={cancelar}
              style={{ flex: 1 }}
            />
            <Button
              label={saving ? "Guardando..." : "Guardar"}
              variant="filled"
              icon="save-outline"
              onPress={guardar}
              disabled={saving}
              style={{ flex: 2 }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, gap: 16, paddingBottom: 40 },

    editBtn: { padding: 8 },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
    },
    loaderWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 4,
    },

    banner: { alignItems: "center", padding: 28, gap: 8 },
    bannerIcon: {
      width: 72,
      height: 72,
      alignItems: "center",
      justifyContent: "center",
    },
    slugPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 5,
    },

    successBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 12,
    },

    fieldsEdit: { gap: 16 },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    previewCard: { padding: 16 },
    previewHeader: { flexDirection: "row", alignItems: "center", gap: 6 },

    editActions: { flexDirection: "row", gap: 8 },
  });
