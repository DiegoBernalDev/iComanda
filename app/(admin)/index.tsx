import { Counter, Enter, PressScale } from "@/components/md3";
import { useAuth } from "@/context/auth";
import { useMD3Theme } from "@/hooks/use-md3-theme";
import { getAdminRestaurant } from "@/lib/admin";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AdminStats = {
  usuarios: number;
  usuariosActivos: number;
  mesasActivas: number;
};

type RestaurantInfo = {
  nombre: string;
  slug: string;
  direccion: string;
  telefono: string;
  logoUrl: string;
};

export default function AdminHome() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();

  const [stats, setStats] = useState<AdminStats>({
    usuarios: 0,
    usuariosActivos: 0,
    mesasActivas: 0,
  });
  const [restaurant, setRestaurant] = useState<RestaurantInfo>({
    nombre: "Restaurante",
    slug: "",
    direccion: "",
    telefono: "",
    logoUrl: "",
  });

  const cargarPanel = useCallback(async () => {
    const restaurantData = await getAdminRestaurant(profile?.id ?? null);
    const [{ data: profiles }, { data: tables }] = await Promise.all([
      supabase.from("profiles").select("id, activo"),
      restaurantData
        ? supabase
            .from("tables")
            .select("id, activa")
            .eq("restaurant_id", restaurantData.id)
        : Promise.resolve({ data: [] }),
    ]);

    setStats({
      usuarios: profiles?.length ?? 0,
      usuariosActivos: profiles?.filter((user) => user.activo).length ?? 0,
      mesasActivas: tables?.filter((table) => table.activa).length ?? 0,
    });

    if (restaurantData) {
      setRestaurant({
        nombre: restaurantData.nombre,
        slug: restaurantData.slug,
        direccion: restaurantData.direccion ?? "",
        telefono: restaurantData.telefono ?? "",
        logoUrl: restaurantData.logo_url ?? "",
      });
    }
  }, [profile?.id]);

  useEffect(() => {
    cargarPanel();
  }, [cargarPanel]);

  useFocusEffect(
    useCallback(() => {
      cargarPanel();
    }, [cargarPanel]),
  );

  useEffect(() => {
    supabase
      .getChannels()
      .filter((ch) => ch.topic === "realtime:admin-home-live")
      .forEach((ch) => {
        supabase.removeChannel(ch);
      });

    const channel = supabase
      .channel("admin-home-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => cargarPanel(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "restaurants" },
        () => cargarPanel(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => cargarPanel(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cargarPanel]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* App Bar */}
      <View
        style={[
          s.appBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <View style={s.appBarLeft}>
          {restaurant.logoUrl ? (
            <Image
              source={{ uri: restaurant.logoUrl }}
              style={[s.headerLogo, { borderRadius: shape.full }]}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                s.headerLogo,
                s.headerLogoFallback,
                {
                  borderRadius: shape.full,
                  backgroundColor: colors.primaryContainer,
                },
              ]}
            >
              <Ionicons
                name="storefront-outline"
                size={20}
                color={colors.onPrimaryContainer}
              />
            </View>
          )}
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
              numberOfLines={1}
            >
              {restaurant.nombre}
            </Text>
          </View>
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
        {/* Stats */}
        <Enter delay={0}>
          <View style={s.statsRow}>
            {[
              {
                icon: "people-outline" as const,
                value: stats.usuarios,
                label: "Usuarios",
                color: colors.primary,
              },
              {
                icon: "person-outline" as const,
                value: stats.usuariosActivos,
                label: "Activos",
                color: colors.tertiary,
              },
              {
                icon: "grid-outline" as const,
                value: stats.mesasActivas,
                label: "Mesas",
                color: colors.secondary,
              },
            ].map((s) => (
              <View
                key={s.label}
                style={[
                  {
                    flex: 1,
                    backgroundColor: colors.surfaceContainerHigh,
                    borderRadius: shape.medium,
                    padding: 14,
                    alignItems: "center",
                    gap: 4,
                  },
                ]}
              >
                <Ionicons name={s.icon} size={20} color={s.color} />
                <Counter
                  value={s.value}
                  style={[
                    typography.headlineSmall,
                    { color: colors.onSurface },
                  ]}
                />
                <Text
                  style={[
                    typography.labelMedium,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </Enter>

        {/* Módulos */}
        <Enter delay={100}>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.onSurface, marginBottom: 12 },
            ]}
          >
            Panel
          </Text>
        </Enter>
        <View style={s.modulesGrid}>
          {[
            {
              icon: "people-outline" as const,
              label: "Usuarios",
              desc: "Personal y accesos",
              bg: colors.primaryContainer,
              on: colors.onPrimaryContainer,
              route: "/(admin)/usuarios",
            },
            {
              icon: "grid-outline" as const,
              label: "Mesas",
              desc: "Salón y capacidad",
              bg: colors.secondaryContainer,
              on: colors.onSecondaryContainer,
              route: "/(admin)/mesas",
            },
            {
              icon: "storefront-outline" as const,
              label: "Restaurante",
              desc: "Datos del negocio",
              bg: colors.tertiaryContainer,
              on: colors.onTertiaryContainer,
              route: "/(admin)/restaurante",
            },
            {
              icon: "receipt-outline" as const,
              label: "Pedidos",
              desc: "Próximamente",
              bg: colors.surfaceVariant,
              on: colors.onSurfaceVariant,
              route: null,
            },
          ].map((m, i) => (
            <Enter key={m.label} delay={150 + i * 70} style={s.moduleCardWrap}>
              <PressScale
                onPress={
                  m.route ? () => router.push(m.route as any) : undefined
                }
                style={[
                  s.moduleCard,
                  {
                    backgroundColor: m.bg,
                    borderRadius: shape.large,
                    opacity: m.route ? 1 : 0.68,
                  },
                ]}
                android_ripple={{ color: m.on + "24" }}
              >
                <View
                  style={[
                    s.moduleIconBox,
                    {
                      backgroundColor: m.on + "14",
                      borderRadius: shape.medium,
                    },
                  ]}
                >
                  <Ionicons name={m.icon} size={24} color={m.on} />
                </View>
                <Text
                  style={[
                    typography.titleSmall,
                    { color: m.on, marginTop: 14 },
                  ]}
                  numberOfLines={1}
                >
                  {m.label}
                </Text>
                <Text
                  style={[
                    typography.bodySmall,
                    { color: m.on + "CC", marginTop: 2 },
                  ]}
                  numberOfLines={2}
                >
                  {m.desc}
                </Text>
                {m.route && (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={m.on}
                    style={s.moduleArrow}
                  />
                )}
                {!m.route && (
                  <View
                    style={[
                      s.comingSoonBadge,
                      { borderColor: m.on + "66", borderRadius: shape.full },
                    ]}
                  >
                    <Text style={[typography.labelSmall, { color: m.on }]}>
                      Luego
                    </Text>
                  </View>
                )}
              </PressScale>
            </Enter>
          ))}
        </View>

        {/* Info restaurante */}
        <Enter delay={400}>
          <Text
            style={[
              typography.titleMedium,
              { color: colors.onSurface, marginBottom: 12 },
            ]}
          >
            Datos del restaurante
          </Text>
        </Enter>
        <Enter delay={450}>
          <View
            style={[
              s.restaurantPanel,
              {
                backgroundColor: colors.surfaceContainerHigh,
                borderRadius: shape.large,
              },
            ]}
          >
            {[
              {
                icon: "storefront-outline" as const,
                label: "Nombre",
                value: restaurant.nombre,
              },
              {
                icon: "link-outline" as const,
                label: "Slug",
                value: `/${restaurant.slug}`,
              },
              {
                icon: "location-outline" as const,
                label: "Dirección",
                value: restaurant.direccion,
              },
              {
                icon: "call-outline" as const,
                label: "Teléfono",
                value: restaurant.telefono,
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
                <View
                  style={[
                    s.infoIconBox,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderRadius: shape.small,
                    },
                  ]}
                >
                  <Ionicons
                    name={row.icon}
                    size={16}
                    color={colors.onSurfaceVariant}
                  />
                </View>
                <View style={s.infoText}>
                  <Text
                    style={[
                      typography.labelSmall,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    {row.label}
                  </Text>
                  <Text
                    style={[typography.bodyMedium, { color: colors.onSurface }]}
                    numberOfLines={1}
                  >
                    {row.value || "-"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Enter>
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
    appBarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
    },
    headerLogo: { width: 44, height: 44 },
    headerLogoFallback: { alignItems: "center", justifyContent: "center" },
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
    modulesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 24,
    },
    moduleCardWrap: { width: "47.5%" },
    moduleCard: { minHeight: 136, padding: 16 },
    moduleIconBox: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    moduleArrow: { position: "absolute", top: 16, right: 16 },
    comingSoonBadge: {
      position: "absolute",
      top: 14,
      right: 14,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },

    restaurantPanel: { paddingHorizontal: 12, overflow: "hidden" },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    infoIconBox: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent: "center",
    },
    infoText: { flex: 1, gap: 2 },
  });
