import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
import { useState, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMD3Theme } from '@/hooks/use-md3-theme';
import { TopAppBar, Card, TextField, Button, Chip } from '@/components/md3';
import { MOCK_MESAS, Mesa } from '@/constants/mock';

export default function MesasScreen() {
  const { colors, typography, shape } = useMD3Theme();
  const s = useMemo(() => makeStyles(colors, shape), [colors, shape]);

  const [mesas, setMesas]               = useState<Mesa[]>(MOCK_MESAS);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando]         = useState<Mesa | null>(null);
  const [numero, setNumero]             = useState('');
  const [capacidad, setCapacidad]       = useState('');

  const abrirCrear  = () => { setEditando(null); setNumero(''); setCapacidad(''); setModalVisible(true); };
  const abrirEditar = (m: Mesa) => { setEditando(m); setNumero(String(m.numero)); setCapacidad(String(m.capacidad)); setModalVisible(true); };

  const guardar = () => {
    if (!numero || !capacidad) return;
    if (editando) {
      setMesas(prev => prev.map(m => m.id === editando.id ? { ...m, numero: parseInt(numero), capacidad: parseInt(capacidad) } : m));
    } else {
      setMesas(prev => [...prev, { id: `m${Date.now()}`, numero: parseInt(numero), capacidad: parseInt(capacidad), activa: true }]);
    }
    setModalVisible(false);
  };

  const eliminar     = (id: string) => setMesas(prev => prev.filter(m => m.id !== id));
  const toggleActiva = (id: string) => setMesas(prev => prev.map(m => m.id === id ? { ...m, activa: !m.activa } : m));

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.background }]}>
      <TopAppBar
        title="Mesas"
        onBack={() => router.back()}
        trailing={
          <Pressable onPress={abrirCrear}
            style={[s.addBtn, { backgroundColor: colors.primaryContainer, borderRadius: shape.medium }]}
            android_ripple={{ color: colors.onPrimaryContainer + '30' }}>
            <Ionicons name="add" size={22} color={colors.onPrimaryContainer} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Summary chips */}
        <View style={s.chips}>
          <Chip label={`${mesas.length} total`}                            icon="grid-outline"             />
          <Chip label={`${mesas.filter(m => m.activa).length} activas`}   icon="checkmark-circle-outline" selected />
          <Chip label={`${mesas.filter(m => !m.activa).length} inactivas`} icon="close-circle-outline"    />
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {mesas.map(mesa => (
            <Card key={mesa.id} variant={mesa.activa ? 'elevated' : 'filled'} style={[s.mesaCard, !mesa.activa && { opacity: 0.65 }]}>
              {/* Top row */}
              <View style={s.mesaTop}>
                <View style={[s.mesaIconBg, {
                  backgroundColor: mesa.activa ? colors.primaryContainer : colors.surfaceVariant,
                  borderRadius: shape.medium,
                }]}>
                  <Ionicons name="grid-outline" size={20}
                    color={mesa.activa ? colors.onPrimaryContainer : colors.onSurfaceVariant} />
                </View>
                <Chip
                  label={mesa.activa ? 'Activa' : 'Inactiva'}
                  selected={mesa.activa}
                  variant="filter"
                />
              </View>

              <Text style={[typography.titleMedium, { color: colors.onSurface, marginTop: 8 }]}>
                Mesa {mesa.numero}
              </Text>
              <View style={s.capRow}>
                <Ionicons name="people-outline" size={13} color={colors.onSurfaceVariant} />
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  {mesa.capacidad} personas
                </Text>
              </View>

              {/* Action buttons */}
              <View style={s.actions}>
                <Pressable onPress={() => abrirEditar(mesa)}
                  style={[s.actionBtn, { backgroundColor: colors.secondaryContainer, borderRadius: shape.small }]}
                  android_ripple={{ color: colors.onSecondaryContainer + '30' }}>
                  <Ionicons name="create-outline" size={15} color={colors.onSecondaryContainer} />
                </Pressable>
                <Pressable onPress={() => toggleActiva(mesa.id)}
                  style={[s.actionBtn, { backgroundColor: colors.tertiaryContainer, borderRadius: shape.small }]}
                  android_ripple={{ color: colors.onTertiaryContainer + '30' }}>
                  <Ionicons name={mesa.activa ? 'pause-outline' : 'play-outline'} size={15} color={colors.onTertiaryContainer} />
                </Pressable>
                <Pressable onPress={() => eliminar(mesa.id)}
                  style={[s.actionBtn, { backgroundColor: colors.errorContainer, borderRadius: shape.small }]}
                  android_ripple={{ color: colors.onErrorContainer + '30' }}>
                  <Ionicons name="trash-outline" size={15} color={colors.onErrorContainer} />
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>

      {/* Modal nueva / editar mesa */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, {
            backgroundColor: colors.surfaceContainerHigh,
            borderTopLeftRadius: shape.extraLarge,
            borderTopRightRadius: shape.extraLarge,
          }]}>
            <View style={[s.handle, { backgroundColor: colors.onSurfaceVariant + '40' }]} />

            <Text style={[typography.titleLarge, { color: colors.onSurface, marginBottom: 24 }]}>
              {editando ? 'Editar mesa' : 'Nueva mesa'}
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
              <Button label="Cancelar" variant="text"   onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button label={editando ? 'Guardar' : 'Crear'} variant="filled"
                icon={editando ? 'save-outline' : 'add-circle-outline'}
                onPress={guardar} style={{ flex: 2 }} />
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

  addBtn: { padding: 8 },

  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mesaCard:   { width: '47.5%', padding: 14 },
  mesaTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mesaIconBg: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  capRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  actions:    { flexDirection: 'row', gap: 6, marginTop: 12 },
  actionBtn:  { flex: 1, alignItems: 'center', paddingVertical: 8 },

  modalOverlay: { flex: 1, backgroundColor: '#00000055', justifyContent: 'flex-end' },
  modalCard:    { padding: 24, paddingTop: 12 },
  handle:       { width: 32, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 8, marginTop: 24 },
});
