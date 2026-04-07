import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import {
  createPermission,
  getEmployeePermissions,
  getPermissionTypes,
  Permission,
  PermissionStatus,
  updatePermission,
} from '@/services/permissions';
import { useAuthStore } from '@/stores/auth';
import LoginScreen from './login';

// ── Design tokens ─────────────────────────────────────────

const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.12)',
  accentBorder: 'rgba(0,229,204,0.30)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.45)',
  card: 'rgba(237,244,255,0.05)',
  cardBorder: 'rgba(237,244,255,0.08)',
  overlay: 'rgba(0,0,0,0.75)',
  modalBg: '#0D1A2E',
  orb1: 'rgba(0,180,216,0.12)',
  orb2: 'rgba(100,30,200,0.09)',
  pending: '#FBB83A',
  approved: '#4ADE80',
  rejected: '#FF6B6B',
  inputBg: 'rgba(237,244,255,0.06)',
};

const F = Platform.select({
  ios: { heavy: 'AvenirNext-Heavy', demi: 'AvenirNext-DemiBold', regular: 'AvenirNext-Regular' },
  default: { heavy: 'sans-serif-condensed', demi: 'sans-serif-medium', regular: 'sans-serif' },
});

// ── Helpers ───────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function statusColor(status: PermissionStatus): string {
  if (status === 'aprobado') return C.approved;
  if (status === 'rechazado') return C.rejected;
  return C.pending;
}

function statusLabel(status: PermissionStatus): string {
  if (status === 'aprobado') return 'Aprobado';
  if (status === 'rechazado') return 'Rechazado';
  return 'Pendiente';
}

// ── Permission card ───────────────────────────────────────

function PermissionCard({ item, onEdit }: { item: Permission; onEdit: () => void }) {
  const color = statusColor(item.response_status);
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardType}>{item.permission_type.name}</Text>
        <View style={styles.cardHeaderRight}>
          <View style={[styles.statusBadge, { borderColor: color }]}>
            <Text style={[styles.statusText, { color }]}>{statusLabel(item.response_status)}</Text>
          </View>
          {item.response_status === 'pendiente' && (
            <TouchableOpacity onPress={onEdit} hitSlop={10} style={styles.editBtn}>
              <MaterialIcons name="edit" size={16} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.cardDates}>
        <MaterialIcons name="date-range" size={14} color={C.muted} />
        <Text style={styles.cardDateText}>
          {formatDate(item.start_date)} → {formatDate(item.end_date)}
        </Text>
      </View>
      {!!item.justification && (
        <Text style={styles.cardJustification} numberOfLines={2}>
          {item.justification}
        </Text>
      )}
    </View>
  );
}

// ── Shared calendar / type-picker modal internals ─────────

type CalendarTarget = 'start' | 'end' | null;

function CalendarPicker({
  target,
  markedDates,
  onDayPress,
  onCancel,
}: {
  target: CalendarTarget;
  markedDates: Record<string, { selected: boolean; selectedColor: string }>;
  onDayPress: (day: { dateString: string }) => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.calendarWrap}>
      <Text style={styles.calLabel}>
        {target === 'start' ? 'Fecha de inicio' : 'Fecha de fin'}
      </Text>
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: C.modalBg,
          calendarBackground: C.modalBg,
          textSectionTitleColor: C.muted,
          selectedDayBackgroundColor: C.accent,
          selectedDayTextColor: C.bg,
          todayTextColor: C.accent,
          dayTextColor: C.text,
          textDisabledColor: C.muted,
          arrowColor: C.accent,
          monthTextColor: C.text,
        }}
      />
      <TouchableOpacity style={styles.calCancelBtn} onPress={onCancel}>
        <Text style={styles.calCancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Create permission modal ───────────────────────────────

interface CreateModalProps {
  visible: boolean;
  employeeId: number;
  userId: number;
  onClose: () => void;
}

function CreatePermissionModal({ visible, employeeId, userId, onClose }: CreateModalProps) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeId, setTypeId] = useState<number | null>(null);
  const [calTarget, setCalTarget] = useState<CalendarTarget>(null);

  const { data: typesData, isLoading: loadingTypes } = useQuery({
    queryKey: ['permissionTypes'],
    queryFn: getPermissionTypes,
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: createPermission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', employeeId] });
      handleClose();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleClose() {
    setStartDate(''); setEndDate(''); setTypeId(null); setCalTarget(null);
    onClose();
  }

  function handleDayPress(day: { dateString: string }) {
    if (calTarget === 'start') setStartDate(day.dateString);
    else setEndDate(day.dateString);
    setCalTarget(null);
  }

  function handleSubmit() {
    if (!startDate || !endDate) { Alert.alert('Campos requeridos', 'Selecciona las fechas de inicio y fin.'); return; }
    if (startDate > endDate) { Alert.alert('Fechas inválidas', 'La fecha de inicio no puede ser posterior a la fecha de fin.'); return; }
    if (!typeId) { Alert.alert('Campos requeridos', 'Selecciona un tipo de permiso.'); return; }
    mutation.mutate({ start_date: startDate, end_date: endDate, employee_id: employeeId, permission_type_id: typeId, responsible_user: userId });
  }

  const markedDates: Record<string, { selected: boolean; selectedColor: string }> = {};
  if (startDate) markedDates[startDate] = { selected: true, selectedColor: C.accent };
  if (endDate) markedDates[endDate] = { selected: true, selectedColor: C.accent };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Solicitar permiso</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          {calTarget !== null ? (
            <CalendarPicker
              target={calTarget}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onCancel={() => setCalTarget(null)}
            />
          ) : (
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Fecha de inicio *</Text>
              <TouchableOpacity style={styles.dateField} onPress={() => setCalTarget('start')}>
                <MaterialIcons name="calendar-today" size={16} color={C.accent} />
                <Text style={[styles.dateFieldText, !startDate && { color: C.muted }]}>
                  {startDate ? formatDate(startDate) : 'Seleccionar'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Fecha de fin *</Text>
              <TouchableOpacity style={styles.dateField} onPress={() => setCalTarget('end')}>
                <MaterialIcons name="calendar-today" size={16} color={C.accent} />
                <Text style={[styles.dateFieldText, !endDate && { color: C.muted }]}>
                  {endDate ? formatDate(endDate) : 'Seleccionar'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Tipo de permiso *</Text>
              {loadingTypes ? (
                <ActivityIndicator color={C.accent} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.typeGrid}>
                  {typesData?.items.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typeChip, typeId === t.id && styles.typeChipActive]}
                      onPress={() => setTypeId(t.id)}>
                      <Text style={[styles.typeChipText, typeId === t.id && styles.typeChipTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, mutation.isPending && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={mutation.isPending}>
                {mutation.isPending
                  ? <ActivityIndicator color={C.bg} size="small" />
                  : <Text style={styles.submitText}>Enviar solicitud</Text>}
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Edit permission modal ─────────────────────────────────

interface EditModalProps {
  item: Permission | null;
  employeeId: number;
  onClose: () => void;
}

function EditPermissionModal({ item, employeeId, onClose }: EditModalProps) {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeId, setTypeId] = useState<number | null>(null);
  const [url, setUrl] = useState('');
  const [calTarget, setCalTarget] = useState<CalendarTarget>(null);

  useEffect(() => {
    if (item) {
      setStartDate(item.start_date);
      setEndDate(item.end_date);
      setTypeId(item.permission_type.id);
      setUrl(item.url ?? '');
      setCalTarget(null);
    }
  }, [item]);

  const { data: typesData, isLoading: loadingTypes } = useQuery({
    queryKey: ['permissionTypes'],
    queryFn: getPermissionTypes,
    staleTime: 10 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updatePermission>[1] }) =>
      updatePermission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', employeeId] });
      onClose();
    },
    onError: (err: Error) => Alert.alert('Error', err.message),
  });

  function handleDayPress(day: { dateString: string }) {
    if (calTarget === 'start') setStartDate(day.dateString);
    else setEndDate(day.dateString);
    setCalTarget(null);
  }

  function handleSubmit() {
    if (!startDate || !endDate) { Alert.alert('Campos requeridos', 'Selecciona las fechas de inicio y fin.'); return; }
    if (startDate > endDate) { Alert.alert('Fechas inválidas', 'La fecha de inicio no puede ser posterior a la fecha de fin.'); return; }
    if (!typeId) { Alert.alert('Campos requeridos', 'Selecciona un tipo de permiso.'); return; }
    mutation.mutate({
      id: item!.id,
      data: { start_date: startDate, end_date: endDate, permission_type_id: typeId, url: url.trim() || undefined },
    });
  }

  const markedDates: Record<string, { selected: boolean; selectedColor: string }> = {};
  if (startDate) markedDates[startDate] = { selected: true, selectedColor: C.accent };
  if (endDate) markedDates[endDate] = { selected: true, selectedColor: C.accent };

  return (
    <Modal visible={item !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar permiso</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <MaterialIcons name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          {calTarget !== null ? (
            <CalendarPicker
              target={calTarget}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onCancel={() => setCalTarget(null)}
            />
          ) : (
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Fecha de inicio *</Text>
              <TouchableOpacity style={styles.dateField} onPress={() => setCalTarget('start')}>
                <MaterialIcons name="calendar-today" size={16} color={C.accent} />
                <Text style={[styles.dateFieldText, !startDate && { color: C.muted }]}>
                  {startDate ? formatDate(startDate) : 'Seleccionar'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Fecha de fin *</Text>
              <TouchableOpacity style={styles.dateField} onPress={() => setCalTarget('end')}>
                <MaterialIcons name="calendar-today" size={16} color={C.accent} />
                <Text style={[styles.dateFieldText, !endDate && { color: C.muted }]}>
                  {endDate ? formatDate(endDate) : 'Seleccionar'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Tipo de permiso *</Text>
              {loadingTypes ? (
                <ActivityIndicator color={C.accent} style={{ marginVertical: 12 }} />
              ) : (
                <View style={styles.typeGrid}>
                  {typesData?.items.map((t) => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.typeChip, typeId === t.id && styles.typeChipActive]}
                      onPress={() => setTypeId(t.id)}>
                      <Text style={[styles.typeChipText, typeId === t.id && styles.typeChipTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.fieldLabel}>Documento adjunto (URL)</Text>
              <TextInput
                style={styles.textInput}
                value={url}
                onChangeText={setUrl}
                placeholder="https://..."
                placeholderTextColor={C.muted}
                autoCapitalize="none"
                keyboardType="url"
              />

              <TouchableOpacity
                style={[styles.submitBtn, mutation.isPending && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={mutation.isPending}>
                {mutation.isPending
                  ? <ActivityIndicator color={C.bg} size="small" />
                  : <Text style={styles.submitText}>Guardar cambios</Text>}
              </TouchableOpacity>
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen content ───────────────────────────────────

function PermisosContent({ employeeId, userId }: { employeeId: number; userId: number }) {
  const [createVisible, setCreateVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Permission | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['permissions', employeeId],
    queryFn: () => getEmployeePermissions(employeeId),
    enabled: employeeId > 0,
  });

  return (
    <View style={styles.root}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Permisos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateVisible(true)}>
          <MaterialIcons name="add" size={22} color={C.bg} />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <MaterialIcons name="wifi-off" size={40} color={C.muted} />
          <Text style={styles.emptyText}>No se pudieron cargar los permisos</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PermissionCard item={item} onEdit={() => setEditingItem(item)} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={C.accent}
              colors={[C.accent]}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialIcons name="event-available" size={48} color={C.muted} />
              <Text style={styles.emptyText}>No tienes permisos registrados</Text>
              <Text style={styles.emptySubtext}>Pulsa + para solicitar uno</Text>
            </View>
          }
        />
      )}

      <CreatePermissionModal
        visible={createVisible}
        employeeId={employeeId}
        userId={userId}
        onClose={() => setCreateVisible(false)}
      />
      <EditPermissionModal
        item={editingItem}
        employeeId={employeeId}
        onClose={() => setEditingItem(null)}
      />
    </View>
  );
}

// ── Root export ───────────────────────────────────────────

export default function PermisosScreen() {
  const { user } = useAuthStore();
  if (!user) return <LoginScreen />;
  if (!user.id_employee) {
    return (
      <View style={[styles.root, styles.centered]}>
        <MaterialIcons name="person-off" size={40} color={C.muted} />
        <Text style={styles.emptyText}>Sin empleado vinculado</Text>
        <Text style={styles.emptySubtext}>Tu cuenta no está asociada a un empleado.</Text>
      </View>
    );
  }
  return <PermisosContent employeeId={user.id_employee} userId={user.id} />;
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  orb1: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: C.orb1, top: -50, right: -70,
  },
  orb2: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: C.orb2, bottom: 160, left: -60,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.6, fontFamily: F?.heavy,
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 12, flexGrow: 1 },
  emptyText: { fontSize: 16, color: C.muted, textAlign: 'center', fontFamily: F?.demi },
  emptySubtext: { fontSize: 13, color: C.muted, textAlign: 'center', fontFamily: F?.regular },

  // Card
  card: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.cardBorder,
    padding: 16, gap: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardType: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, fontFamily: F?.demi },
  editBtn: { padding: 2 },
  statusBadge: {
    borderWidth: 1, borderRadius: 20,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, fontFamily: F?.demi },
  cardDates: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardDateText: { fontSize: 13, color: C.muted, fontFamily: F?.regular },
  cardJustification: { fontSize: 13, color: C.muted, fontFamily: F?.regular, lineHeight: 18 },

  // Error
  retryBtn: {
    marginTop: 4, paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 20, borderWidth: 1, borderColor: C.accentBorder,
  },
  retryText: { color: C.accent, fontSize: 14, fontFamily: F?.demi },

  // Modal
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: C.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, fontFamily: F?.demi },
  formScroll: { paddingHorizontal: 20, paddingTop: 16 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: C.muted,
    letterSpacing: 1, textTransform: 'uppercase', fontFamily: F?.demi, marginBottom: 8,
  },
  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.accentBorder,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 16,
  },
  dateFieldText: { fontSize: 15, color: C.text, fontFamily: F?.regular },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  typeChip: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  typeChipActive: { backgroundColor: C.accentGlow, borderColor: C.accent },
  typeChipText: { fontSize: 13, color: C.muted, fontFamily: F?.regular },
  typeChipTextActive: { color: C.accent, fontFamily: F?.demi },
  textInput: {
    backgroundColor: C.inputBg, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14,
    color: C.text, fontSize: 14, fontFamily: F?.regular, marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: C.accent, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitText: { fontSize: 15, fontWeight: '700', color: C.bg, fontFamily: F?.demi },

  // Calendar
  calendarWrap: { paddingHorizontal: 12 },
  calLabel: {
    fontSize: 13, color: C.muted, fontFamily: F?.demi,
    paddingHorizontal: 8, paddingVertical: 12,
  },
  calCancelBtn: { alignItems: 'center', paddingVertical: 14 },
  calCancelText: { color: C.muted, fontSize: 14, fontFamily: F?.regular },
});
