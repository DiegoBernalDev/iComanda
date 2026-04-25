import { Card } from "@/components/md3";
import { useAuth } from "@/context/auth";
import { useMD3Theme } from "@/hooks/use-md3-theme";
import { getAdminRestaurant } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminHome() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();

  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [usuariosActivos, setUsuariosActivos] = useState(0);
  const [mesasActivas, setMesasActivas] = useState(0);
  const [restaurante, setRestaurante] = useState({
    nombre: "Restaurante",
    slug: "-",
    direccion: "-",
    telefono: "-",
  });

  const loadDashboard = useCallback(async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("activo");
    const users = profilesData ?? [];
    setTotalUsuarios(users.length);
    setUsuariosActivos(users.filter((u: any) => Boolean(u.activo)).length);

    const restaurantData = await getAdminRestaurant(profile?.id ?? null);
    if (!restaurantData) return;

    setRestaurante({
      nombre: restaurantData.nombre,
      slug: restaurantData.slug,
      direccion: restaurantData.direccion ?? "-",
      telefono: restaurantData.telefono ?? "-",
    });

    const { data: tablesData } = await supabase
      .from("tables")
      .select("activa")
      .eq("restaurant_id", restaurantData.id);

    const tables = tablesData ?? [];
    setMesasActivas(tables.filter((t: any) => Boolean(t.activa)).length);
  }, [profile?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard]),
  );

  useEffect(() => {
    const channel = supabase
      .channel("admin-home-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => loadDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurants" },
        () => loadDashboard(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadDashboard(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDashboard]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <View
        style={[
          s.appBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <View>
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
              name="shield-checkmark-outline"
              size={12}
              color={colors.onPrimaryContainer}
            />
            <Text
              style={[
                typography.labelSmall,
                { color: colors.onPrimaryContainer },
              ]}
            >
              Administrador
            </Text>
          </View>
          <Text
            style={[
              typography.titleLarge,
              { color: colors.onSurface, marginTop: 2 },
            ]}
          >
            Hola, {profile?.nombre?.split(" ")[0] ?? "Admin"}
          </Text>
          <Text
            style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}
          >
            {restaurante.nombre}
          </Text>
        </View>
        <Pressable
          onPress={signOut}
          style={[s.iconBtn, { borderRadius: shape.full }]}
          android_ripple={{
            color: colors.onSurface + "1F",
            borderless: true,
            radius: 24,
          }}
        >
          <Ionicons
            name="log-out-outline"
            size={24}
            color={colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.statsRow}>
          {[
            {
              icon: "people-outline" as const,
              value: totalUsuarios,
              label: "Usuarios",
              color: colors.primary,
            },
            {
              icon: "person-outline" as const,
              value: usuariosActivos,
              label: "Activos",
              color: colors.tertiary,
            },
            {
              icon: "grid-outline" as const,
              value: mesasActivas,
              label: "Mesas",
              color: colors.secondary,
            },
          ].map((stat) => (
            <View
              key={stat.label}
              style={[
                s.statCard,
                {
                  backgroundColor: colors.surfaceContainerHigh,
                  borderRadius: shape.medium,
                },
              ]}
            >
              <Ionicons name={stat.icon} size={20} color={stat.color} />
              <Text
                style={[typography.headlineSmall, { color: colors.onSurface }]}
              >
                {stat.value}
              </Text>
              <Text
                style={[
                  typography.labelMedium,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={[
            typography.titleMedium,
            { color: colors.onSurface, marginBottom: 12 },
          ]}
        >
          Panel
        </Text>
        <View style={s.modulesGrid}>
          {[
            {
              icon: "people-outline" as const,
              label: "Usuarios",
              desc: "Crear y gestionar cuentas",
              color: colors.primaryContainer,
              on: colors.onPrimaryContainer,
              route: "/(admin)/usuarios",
            },
            {
              icon: "grid-outline" as const,
              label: "Mesas",
              desc: "CRUD de mesas",
              color: colors.secondaryContainer,
              on: colors.onSecondaryContainer,
              route: "/(admin)/mesas",
            },
            {
              icon: "storefront-outline" as const,
              label: "Restaurante",
              desc: "Nombre y slug",
              color: colors.tertiaryContainer,
              on: colors.onTertiaryContainer,
              route: "/(admin)/restaurante",
            },
            {
              icon: "receipt-outline" as const,
              label: "Pedidos",
              desc: "Disponible en Sprint 2",
              color: colors.surfaceVariant,
              on: colors.onSurfaceVariant,
              route: null,
            },
          ].map((module) => (
            <Pressable
              key={module.label}
              onPress={
                module.route
                  ? () => router.push(module.route as any)
                  : undefined
              }
              style={[
                s.moduleCard,
                { backgroundColor: module.color, borderRadius: shape.large },
              ]}
              android_ripple={{ color: module.on + "30" }}
            >
              <Ionicons name={module.icon} size={28} color={module.on} />
              <Text
                style={[
                  typography.titleSmall,
                  { color: module.on, marginTop: 12 },
                ]}
              >
                {module.label}
              </Text>
              <Text
                style={[
                  typography.bodySmall,
                  { color: module.on + "CC", marginTop: 2 },
                ]}
              >
                {module.desc}
              </Text>
              {module.route && (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={module.on}
                  style={s.moduleArrow}
                />
              )}
            </Pressable>
          ))}
        </View>

        <Text
          style={[
            typography.titleMedium,
            { color: colors.onSurface, marginBottom: 12 },
          ]}
        >
          Restaurante
        </Text>
        <Card variant="outlined" style={{ padding: 16 }}>
          {[
            {
              icon: "storefront-outline" as const,
              label: "Nombre",
              value: restaurante.nombre,
            },
            {
              icon: "link-outline" as const,
              label: "Slug",
              value: `/${restaurante.slug}`,
            },
            {
              icon: "location-outline" as const,
              label: "Dirección",
              value: restaurante.direccion,
            },
            {
              icon: "call-outline" as const,
              label: "Teléfono",
              value: restaurante.telefono,
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
                  { color: colors.onSurfaceVariant, width: 72 },
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
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    appBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    rolePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: "flex-start",
      marginBottom: 4,
    },
    iconBtn: { padding: 12 },
    scroll: { padding: 16, paddingBottom: 40, gap: 0 },

    statsRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
    statCard: { flex: 1, padding: 14, alignItems: "center", gap: 4 },
    modulesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    },
    moduleCard: { width: "47.5%", padding: 20, minHeight: 140 },
    moduleArrow: { position: "absolute", top: 16, right: 16 },

    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
  });
