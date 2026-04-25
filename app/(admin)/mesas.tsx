import { Button, Card, Chip, TextField, TopAppBar } from "@/components/md3";
import { useAuth } from "@/context/auth";
import { useMD3Theme } from "@/hooks/use-md3-theme";
import { getAdminRestaurant } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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

interface Mesa {
  id: string;
  numero: number;
  capacidad: number;
  activa: boolean;
}

export default function MesasScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState<Mesa | null>(null);
  const [numero, setNumero] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const cargarMesas = useCallback(async (rid: string) => {
    const { data, error: listError } = await supabase
      .from("tables")
      .select("id, numero, capacidad, activa")
      .eq("restaurant_id", rid)
      .order("numero", { ascending: true });

    if (listError) {
      setError(listError.message);
      return;
    }

    const nextMesas: Mesa[] = (data ?? []).map((row: any) => ({
      id: row.id,
      numero: row.numero,
      capacidad: row.capacidad,
      activa: Boolean(row.activa),
    }));

    setMesas(nextMesas);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");

      const restaurant = await getAdminRestaurant(user?.id ?? null);
      if (!restaurant) {
        setError("No se encontró un restaurante para administrar.");
        setLoading(false);
        return;
      }

      setRestaurantId(restaurant.id);
      await cargarMesas(restaurant.id);
      setLoading(false);
    };

    init();
  }, [cargarMesas, user?.id]);

  useEffect(() => {
    if (!restaurantId) return;

    const channel = supabase
      .channel(`admin-mesas-live-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => {
          cargarMesas(restaurantId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarMesas, restaurantId]);

  const abrirCrear = () => {
    setEditando(null);
    setNumero("");
    setCapacidad("");
    setModalVisible(true);
  };
  const abrirEditar = (m: Mesa) => {
    setEditando(m);
    setNumero(String(m.numero));
    setCapacidad(String(m.capacidad));
    setModalVisible(true);
  };

  const guardar = async () => {
    if (!numero || !capacidad) {
      setError("Completá todos los campos.");
      return;
    }

    if (!restaurantId) {
      setError("No se encontró el restaurante para guardar cambios.");
      return;
    }

    const parsedNumero = Number.parseInt(numero, 10);
    const parsedCapacidad = Number.parseInt(capacidad, 10);
    if (
      !Number.isFinite(parsedNumero) ||
      !Number.isFinite(parsedCapacidad) ||
      parsedNumero <= 0 ||
      parsedCapacidad <= 0
    ) {
      setError("Número y capacidad deben ser enteros positivos.");
      return;
    }

    setSaving(true);
    setError("");

    if (editando) {
      const { error: updateError } = await supabase
        .from("tables")
        .update({ numero: parsedNumero, capacidad: parsedCapacidad })
        .eq("id", editando.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("tables").insert({
        restaurant_id: restaurantId,
        numero: parsedNumero,
        capacidad: parsedCapacidad,
        activa: true,
      });

      if (insertError) {
        setError(
          insertError.code === "23505"
            ? "Ya existe una mesa con ese número en el restaurante."
            : insertError.message,
        );
        setSaving(false);
        return;
      }
    }

    await cargarMesas(restaurantId);
    setSaving(false);
    setModalVisible(false);
  };

  const eliminar = async (id: string) => {
    if (!restaurantId) return;

    setSavingId(id);
    setError("");
    const { error: deleteError } = await supabase
      .from("tables")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      setSavingId(null);
      return;
    }

    await cargarMesas(restaurantId);
    setSavingId(null);
  };

  const toggleActiva = async (id: string) => {
    if (!restaurantId) return;
    const mesa = mesas.find((m) => m.id === id);
    if (!mesa) return;

    setSavingId(id);
    setError("");
    const { error: updateError } = await supabase
      .from("tables")
      .update({ activa: !mesa.activa })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSavingId(null);
      return;
    }

    await cargarMesas(restaurantId);
    setSavingId(null);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Mesas"
        onBack={() => router.back()}
        trailing={
          <Pressable
            onPress={abrirCrear}
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
          <Chip label={`${mesas.length} total`} icon="grid-outline" />
          <Chip
            label={`${mesas.filter((m) => m.activa).length} activas`}
            icon="checkmark-circle-outline"
            selected
          />
          <Chip
            label={`${mesas.filter((m) => !m.activa).length} inactivas`}
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
              Cargando mesas...
            </Text>
          </View>
        ) : null}

        {/* Grid */}
        <View style={s.grid}>
          {!loading &&
            mesas.map((mesa) => (
              <Card
                key={mesa.id}
                variant={mesa.activa ? "elevated" : "filled"}
                style={[
                  s.mesaCard,
                  ...(mesa.activa ? [] : [{ opacity: 0.65 }]),
                ]}
              >
                {/* Top row */}
                <View style={s.mesaTop}>
                  <View
                    style={[
                      s.mesaIconBg,
                      {
                        backgroundColor: mesa.activa
                          ? colors.primaryContainer
                          : colors.surfaceVariant,
                        borderRadius: shape.medium,
                      },
                    ]}
                  >
                    <Ionicons
                      name="grid-outline"
                      size={20}
                      color={
                        mesa.activa
                          ? colors.onPrimaryContainer
                          : colors.onSurfaceVariant
                      }
                    />
                  </View>
                  <Chip
                    label={mesa.activa ? "Activa" : "Inactiva"}
                    selected={mesa.activa}
                    variant="filter"
                  />
                </View>

                <Text
                  style={[
                    typography.titleMedium,
                    { color: colors.onSurface, marginTop: 8 },
                  ]}
                >
                  Mesa {mesa.numero}
                </Text>
                <View style={s.capRow}>
                  <Ionicons
                    name="people-outline"
                    size={13}
                    color={colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      typography.bodySmall,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {mesa.capacidad} personas
                  </Text>
                </View>

                {/* Action buttons */}
                <View style={s.actions}>
                  <Pressable
                    onPress={() => abrirEditar(mesa)}
                    disabled={savingId === mesa.id}
                    style={[
                      s.actionBtn,
                      {
                        backgroundColor: colors.secondaryContainer,
                        borderRadius: shape.small,
                      },
                    ]}
                    android_ripple={{
                      color: colors.onSecondaryContainer + "30",
                    }}
                  >
                    <Ionicons
                      name="create-outline"
                      size={15}
                      color={colors.onSecondaryContainer}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => toggleActiva(mesa.id)}
                    disabled={savingId === mesa.id}
                    style={[
                      s.actionBtn,
                      {
                        backgroundColor: colors.tertiaryContainer,
                        borderRadius: shape.small,
                      },
                    ]}
                    android_ripple={{
                      color: colors.onTertiaryContainer + "30",
                    }}
                  >
                    <Ionicons
                      name={mesa.activa ? "pause-outline" : "play-outline"}
                      size={15}
                      color={colors.onTertiaryContainer}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => eliminar(mesa.id)}
                    disabled={savingId === mesa.id}
                    style={[
                      s.actionBtn,
                      {
                        backgroundColor: colors.errorContainer,
                        borderRadius: shape.small,
                      },
                    ]}
                    android_ripple={{ color: colors.onErrorContainer + "30" }}
                  >
                    {savingId === mesa.id ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.onErrorContainer}
                      />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color={colors.onErrorContainer}
                      />
                    )}
                  </Pressable>
                </View>
              </Card>
            ))}
        </View>
      </ScrollView>

      {/* Modal nueva / editar mesa */}
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
              {editando ? "Editar mesa" : "Nueva mesa"}
            </Text>

            <TextField
              label="Número de mesa"
              variant="outlined"
              value={numero}
              onChangeText={setNumero}
              leadingIcon="grid-outline"
              keyboardType="numeric"
            />
            <View style={{ marginTop: 16 }}>
              <TextField
                label="Capacidad (personas)"
                variant="outlined"
                value={capacidad}
                onChangeText={setCapacidad}
                leadingIcon="people-outline"
                keyboardType="numeric"
              />
            </View>

            <View style={s.modalActions}>
              <Button
                label="Cancelar"
                variant="text"
                onPress={() => setModalVisible(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={editando ? "Guardar" : "Crear"}
                variant="filled"
                icon={editando ? "save-outline" : "add-circle-outline"}
                onPress={guardar}
                disabled={saving}
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
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 10,
      marginBottom: 8,
    },
    loaderWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
    },

    addBtn: { padding: 8 },

    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    mesaCard: { width: "47.5%", padding: 14 },
    mesaTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    mesaIconBg: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    capRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 4,
    },
    actions: { flexDirection: "row", gap: 6, marginTop: 12 },
    actionBtn: { flex: 1, alignItems: "center", paddingVertical: 8 },

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
    modalActions: { flexDirection: "row", gap: 8, marginTop: 24 },
  });
