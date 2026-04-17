import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { Card, Surface } from '@/components/md3';
import { useAuth } from '@/context/auth';
import { MOCK_USUARIOS, MOCK_MESAS, MOCK_RESTAURANTE } from '@/constants/mock';

export default function AdminHome() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { profile, signOut } = useAuth();

  const usuariosActivos = MOCK_USUARIOS.filter(u => u.activo).length;
  const mesasActivas    = MOCK_MESAS.filter(m => m.activa).length;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      {/* App Bar */}
      <View style={[s.appBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <View>
          <View style={[s.rolePill, { backgroundColor: colors.primaryContainer, borderRadius: shape.full }]}>
            <Ionicons name="shield-checkmark-outline" size={12} color={colors.onPrimaryContainer} />
            <Text style={[typography.labelSmall, { color: colors.onPrimaryContainer }]}>Administrador</Text>
          </View>
          <Text style={[typography.titleLarge, { color: colors.onSurface, marginTop: 2 }]}>
            Hola, {profile?.nombre?.split(' ')[0] ?? 'Admin'}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
            {MOCK_RESTAURANTE.nombre}
          </Text>
        </View>
        <Pressable onPress={signOut} style={[s.iconBtn, { borderRadius: shape.full }]}
          android_ripple={{ color: colors.onSurface + '1F', borderless: true, radius: 24 }}>
          <Ionicons name="log-out-outline" size={24} color={colors.onSurfaceVariant} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { icon: 'people-outline'          as const, value: MOCK_USUARIOS.length, label: 'Usuarios',  color: colors.primary   },
            { icon: 'person-outline'           as const, value: usuariosActivos,      label: 'Activos',   color: colors.tertiary  },
            { icon: 'grid-outline'             as const, value: mesasActivas,         label: 'Mesas',     color: colors.secondary },
          ].map(s => (
            <View key={s.label} style={[{ flex: 1, backgroundColor: colors.surfaceContainerHigh, borderRadius: shape.medium, padding: 14, alignItems: 'center', gap: 4 }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
              <Text style={[typography.headlineSmall, { color: colors.onSurface }]}>{s.value}</Text>
              <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Módulos */}
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 12 }]}>Panel</Text>
        <View style={s.modulesGrid}>
          {[
            { icon: 'people-outline'    as const, label: 'Usuarios',    desc: 'Crear y gestionar cuentas',   color: colors.primaryContainer,   on: colors.onPrimaryContainer,   route: '/(admin)/usuarios'    },
            { icon: 'grid-outline'      as const, label: 'Mesas',       desc: 'CRUD de mesas',               color: colors.secondaryContainer, on: colors.onSecondaryContainer, route: '/(admin)/mesas'       },
            { icon: 'storefront-outline'as const, label: 'Restaurante', desc: 'Nombre y slug',               color: colors.tertiaryContainer,  on: colors.onTertiaryContainer,  route: '/(admin)/restaurante' },
            { icon: 'receipt-outline'   as const, label: 'Pedidos',     desc: 'Disponible en Sprint 2',      color: colors.surfaceVariant,     on: colors.onSurfaceVariant,     route: null                   },
          ].map(m => (
            <Pressable key={m.label}
              onPress={m.route ? () => router.push(m.route as any) : undefined}
              style={[s.moduleCard, { backgroundColor: m.color, borderRadius: shape.large }]}
              android_ripple={{ color: m.on + '30' }}>
              <Ionicons name={m.icon} size={28} color={m.on} />
              <Text style={[typography.titleSmall, { color: m.on, marginTop: 12 }]}>{m.label}</Text>
              <Text style={[typography.bodySmall, { color: m.on + 'CC', marginTop: 2 }]}>{m.desc}</Text>
              {m.route && (
                <Ionicons name="chevron-forward" size={16} color={m.on} style={s.moduleArrow} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Info restaurante */}
        <Text style={[typography.titleMedium, { color: colors.onSurface, marginBottom: 12 }]}>Restaurante</Text>
        <Card variant="outlined" style={{ padding: 16 }}>
          {[
            { icon: 'storefront-outline' as const, label: 'Nombre',    value: MOCK_RESTAURANTE.nombre    },
            { icon: 'link-outline'        as const, label: 'Slug',      value: `/${MOCK_RESTAURANTE.slug}` },
            { icon: 'location-outline'    as const, label: 'Dirección', value: MOCK_RESTAURANTE.direccion },
            { icon: 'call-outline'        as const, label: 'Teléfono',  value: MOCK_RESTAURANTE.telefono  },
          ].map((row, i, arr) => (
            <View key={row.label} style={[s.infoRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant }]}>
              <Ionicons name={row.icon} size={16} color={colors.onSurfaceVariant} style={{ width: 24 }} />
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, width: 72 }]}>{row.label}</Text>
              <Text style={[typography.bodyMedium, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:    { flex: 1 },
  appBar:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rolePill:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 4 },
  iconBtn: { padding: 12 },
  scroll:  { padding: 16, paddingBottom: 40, gap: 0 },

  statsRow:   { flexDirection: 'row', gap: 8, marginBottom: 24 },
  modulesGrid:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  moduleCard: { width: '47.5%', padding: 20, minHeight: 140 },
  moduleArrow:{ position: 'absolute', top: 16, right: 16 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
});
