import { View, Text, ScrollView, StyleSheet, Pressable, Modal, ActivityIndicator } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { TopAppBar, Card, TextField, Button, Chip, Enter, PressScale, Pop } from '@/components/md3';
import { router } from 'expo-router';
import { Usuario, Role } from '@/constants/mock';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/auth';

type ProfileRow = {
  id: string;
  nombre: string;
  email: string;
  rol: Role;
  activo: boolean;
  created_at: string;
};

const toUsuario = (profile: ProfileRow): Usuario => ({
  id: profile.id,
  nombre: profile.nombre,
  email: profile.email,
  rol: profile.rol,
  activo: profile.activo,
  creadoEn: profile.created_at.slice(0, 10),
});

export default function UsuariosScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);
  const { user } = useAuth();

  const [usuarios, setUsuarios]         = useState<Usuario[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre]             = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [rol, setRol]                   = useState<Role>('mesero');
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading]           = useState(false);
  const [savingId, setSavingId]         = useState<string | null>(null);
  const [error, setError]               = useState('');

  const cargarUsuarios = async () => {
    setInitialLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, nombre, email, rol, activo, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) setError(fetchError.message);
    else setUsuarios((data ?? []).map(profile => toUsuario(profile as ProfileRow)));

    setInitialLoading(false);
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const toggleActivo = async (usuario: Usuario) => {
    if (usuario.id === user?.id && usuario.activo) {
      setError('No podés bloquear tu propio usuario administrador.');
      return;
    }

    const nextActivo = !usuario.activo;
    setSavingId(usuario.id);
    setError('');
    setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: nextActivo } : u));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ activo: nextActivo })
      .eq('id', usuario.id);

    if (updateError) {
      setUsuarios(prev => prev.map(u => u.id === usuario.id ? { ...u, activo: usuario.activo } : u));
      setError(updateError.message);
    }

    setSavingId(null);
  };

  const crearUsuario = async () => {
    if (!nombre || !email || !password) { setError('Completá todos los campos.'); return; }
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: functionError } = await supabase.functions.invoke('crear-usuario', {
      body: {
        nombre: nombre.trim(),
        email: normalizedEmail,
        password,
        rol,
      },
    });

    let functionErrorMessage = functionError?.message;
    const context = (functionError as { context?: unknown } | null)?.context;
    if (context instanceof Response) {
      try {
        const body = await context.json();
        if (typeof body?.error === 'string') functionErrorMessage = body.error;
      } catch {
        // Keep the generic SDK message if the function response is not JSON.
      }
    }

    if (functionError || data?.error || !data?.profile) {
      setError(functionErrorMessage ?? data?.error ?? 'Error al crear usuario.');
      setLoading(false);
      return;
    }

    setUsuarios(prev => [...prev, toUsuario(data.profile as ProfileRow)]);
    setNombre(''); setEmail(''); setPassword(''); setRol('mesero');
    setModalVisible(false);
    setLoading(false);
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Usuarios"
        onBack={() => router.back()}
        trailing={
          <Pressable onPress={() => setModalVisible(true)}
            style={[s.addBtn, { backgroundColor: colors.primaryContainer, borderRadius: shape.medium }]}
            android_ripple={{ color: colors.onPrimaryContainer + '30' }}>
            <Ionicons name="add" size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {error && !modalVisible ? (
          <Pop>
            <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
              <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
            </View>
          </Pop>
        ) : null}

        {/* Summary chips */}
        <Enter delay={0}>
          <View style={s.chips}>
            <Chip label={`${usuarios.length} total`}            icon="people-outline"          />
            <Chip label={`${usuarios.filter(u => u.activo).length} activos`}   icon="checkmark-circle-outline" selected />
            <Chip label={`${usuarios.filter(u => !u.activo).length} inactivos`} icon="close-circle-outline"     />
          </View>
        </Enter>

        {/* Lista */}
        {initialLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : usuarios.map((u, i) => {
          const isCurrentUser = u.id === user?.id;
          const isSelfBlockDisabled = isCurrentUser && u.activo;

          return (
            <Enter key={u.id} delay={80 + i * 50}>
              <Card variant="elevated" style={s.userCard}>
                <View style={[s.avatar, {
                  backgroundColor: u.rol === 'admin' ? colors.primaryContainer : colors.secondaryContainer,
                  borderRadius: shape.medium,
                }]}>
                  <Ionicons
                    name={u.rol === 'admin' ? 'shield-checkmark-outline' : 'person-outline'}
                    size={22}
                    color={u.rol === 'admin' ? colors.onPrimaryContainer : colors.onSecondaryContainer}
                  />
                </View>
                <View style={s.userInfo}>
                  <Text style={[typography.titleSmall, { color: colors.onSurface }]}>{u.nombre}</Text>
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>{u.email}</Text>
                  <View style={s.userMeta}>
                    <View style={[s.rolBadge, {
                      backgroundColor: u.rol === 'admin' ? colors.primaryContainer : colors.secondaryContainer,
                      borderRadius: shape.full,
                    }]}>
                      <Text style={[typography.labelSmall, { color: u.rol === 'admin' ? colors.onPrimaryContainer : colors.onSecondaryContainer }]}>
                        {u.rol}
                        {isCurrentUser ? ' (vos)' : ''}
                      </Text>
                    </View>
                    {!u.activo && (
                      <View style={[s.rolBadge, { backgroundColor: colors.errorContainer, borderRadius: shape.full }]}>
                        <Text style={[typography.labelSmall, { color: colors.onErrorContainer }]}>inactivo</Text>
                      </View>
                    )}
                  </View>
                </View>
                <PressScale
                  onPress={() => toggleActivo(u)}
                  disabled={savingId === u.id || isSelfBlockDisabled}
                  style={[s.toggleBtn, {
                    backgroundColor: u.activo ? colors.tertiaryContainer : colors.surfaceVariant,
                    borderRadius: shape.small,
                    opacity: isSelfBlockDisabled ? 0.45 : 1,
                  }]}
                  android_ripple={{ color: colors.onSurface + '1F' }}
                >
                  {savingId === u.id ? (
                    <ActivityIndicator size="small" color={u.activo ? colors.onTertiaryContainer : colors.onSurfaceVariant} />
                  ) : (
                    <Ionicons
                      name={u.activo ? 'pause-outline' : 'play-outline'}
                      size={18}
                      color={u.activo ? colors.onTertiaryContainer : colors.onSurfaceVariant}
                    />
                  )}
                </PressScale>
              </Card>
            </Enter>
          );
        })}
      </ScrollView>

      {/* Modal nuevo usuario */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.surfaceContainerHigh, borderTopLeftRadius: shape.extraLarge, borderTopRightRadius: shape.extraLarge }]}>
            {/* Handle */}
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />

            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 24 }]}>Nuevo usuario</Text>

            <TextField label="Nombre completo" variant="outlined" value={nombre} onChangeText={setNombre} leadingIcon="person-outline" containerColor={colors.surfaceContainerHigh} />
            <View style={{ marginTop: 16 }}>
              <TextField label="Correo electrónico" variant="outlined" value={email} onChangeText={setEmail} leadingIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" containerColor={colors.surfaceContainerHigh} />
            </View>
            <View style={{ marginTop: 16 }}>
              <TextField label="Contraseña temporal" variant="outlined" value={password} onChangeText={setPassword} leadingIcon="lock-closed-outline" secureTextEntry containerColor={colors.surfaceContainerHigh} />
            </View>

            {error ? (
              <View style={[s.errorBanner, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}>
                <Ionicons name="alert-circle-outline" size={14} color={colors.onErrorContainer} />
                <Text style={[typography.bodySmall, { color: colors.onErrorContainer, flex: 1 }]}>{error}</Text>
              </View>
            ) : null}

            <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant, marginTop: 20, marginBottom: 10 }]}>Rol</Text>
            <View style={s.rolSelector}>
              {(['mesero', 'admin'] as Role[]).map(r => (
                <Pressable key={r} onPress={() => setRol(r)}
                  style={[s.rolOption, {
                    backgroundColor: rol === r ? colors.primaryContainer : colors.surfaceVariant,
                    borderRadius: shape.medium,
                    borderWidth: rol === r ? 0 : 1,
                    borderColor: colors.outline,
                  }]}>
                  <Ionicons name={r === 'admin' ? 'shield-checkmark-outline' : 'person-outline'} size={18}
                    color={rol === r ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
                  <Text style={[typography.labelLarge, { color: rol === r ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={s.modalActions}>
              <Button label="Cancelar" variant="text" onPress={() => { setModalVisible(false); setError(''); }} style={{ flex: 1 }} />
              <Button label={loading ? 'Creando...' : 'Crear'} variant="filled" icon="person-add-outline" onPress={crearUsuario} disabled={loading} style={{ flex: 2 }} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (colors: any, shape: any) => StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },

  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },

  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  avatar:   { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1, gap: 4 },
  userMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  rolBadge: { paddingHorizontal: 10, paddingVertical: 2 },
  toggleBtn:{ padding: 10 },
  loadingBox:{ paddingVertical: 32 },

  addBtn: { padding: 8 },

  errorBanner:  { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, marginTop: 12 },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard:    { padding: 24, paddingTop: 12 },
  handle:       { width: 32, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  rolSelector:  { flexDirection: 'row', gap: 10 },
  rolOption:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 24 },
});
