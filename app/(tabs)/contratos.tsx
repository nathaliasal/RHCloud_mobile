import { useQuery } from '@tanstack/react-query';
import { AppIcon } from '@/components/ui/app-icon';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';

import {
  Contract,
  ContractStatus,
  getContracts,
  getContractLatestDocUrl,
  getContractSchedules,
  Schedule,
} from '@/services/contracts';
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
  active: '#4ADE80',
  inactive: 'rgba(237,244,255,0.35)',
  suspended: '#FBB83A',
};

const F = Platform.select({
  ios: { heavy: 'AvenirNext-Heavy', demi: 'AvenirNext-DemiBold', regular: 'AvenirNext-Regular' },
  default: { heavy: 'sans-serif-condensed', demi: 'sans-serif-medium', regular: 'sans-serif' },
});

// ── Types ─────────────────────────────────────────────────

type StatusFilter = 'todos' | ContractStatus;
type CalendarTarget = 'start' | 'end' | null;

interface FilterState {
  status: StatusFilter;
  startDate: string;
  endDate: string;
}

// ── Helpers ───────────────────────────────────────────────

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

function formatSalary(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

function statusColor(status: ContractStatus): string {
  if (status === 'activo') return C.active;
  if (status === 'inactivo') return C.inactive;
  return C.suspended;
}

// ── Schedule helpers ──────────────────────────────────────

const DAYS_FULL = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const DAY_SHORT = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 – 22:00

function parseMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function isHourCovered(schedules: Schedule[], day: string, hour: number): boolean {
  const slotStart = hour * 60;
  const slotEnd = (hour + 1) * 60;
  return schedules.some(s => {
    if (s.week_day.toLowerCase() !== day.toLowerCase()) return false;
    const startMins = parseMinutes(s.start_time);
    const endMins = parseMinutes(s.end_time);
    return startMins < slotEnd && endMins > slotStart;
  });
}

// ── Schedule grid ─────────────────────────────────────────

function ScheduleGrid({ schedules }: { schedules: Schedule[] }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={grid.row}>
        <View style={grid.hourCol} />
        {DAY_SHORT.map(d => (
          <View key={d} style={grid.dayCol}>
            <Text style={grid.dayText}>{d}</Text>
          </View>
        ))}
      </View>
      {HOURS.map(h => (
        <View key={h} style={grid.row}>
          <View style={grid.hourCol}>
            <Text style={grid.hourText}>{`${String(h).padStart(2, '0')}:00`}</Text>
          </View>
          {DAYS_FULL.map((day, i) => {
            const covered = isHourCovered(schedules, day, h);
            return (
              <View
                key={i}
                style={[grid.cell, covered && grid.cellCovered]}
              />
            );
          })}
        </View>
      ))}
      <View style={grid.legend}>
        <View style={grid.legendDot} />
        <Text style={grid.legendText}>Horario laboral</Text>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

// ── Schedule modal ────────────────────────────────────────

interface ScheduleModalProps {
  contract: Contract | null;
  onClose: () => void;
}

function ScheduleModal({ contract, onClose }: ScheduleModalProps) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['schedules', contract?.id],
    queryFn: () => getContractSchedules(contract!.id),
    enabled: contract !== null,
  });

  console.log('[ScheduleModal] contract:', contract?.id, '| isLoading:', isLoading, '| isError:', isError, '| data:', JSON.stringify(data));

  return (
    <Modal visible={contract !== null} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleWrap}>
              <Text style={styles.modalTitle}>Horarios del contrato</Text>
              {contract && (
                <Text style={styles.modalSubtitle} numberOfLines={1}>{contract.contract_name}</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <AppIcon name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.modalCentered}>
              <ActivityIndicator color={C.accent} size="large" />
            </View>
          )}
          {isError && (
            <View style={styles.modalCentered}>
              <AppIcon name="wifiOff" size={36} color={C.muted} />
              <Text style={styles.emptyText}>No se pudo cargar el horario</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}
          {!isLoading && !isError && (
            (data ?? []).length === 0 ? (
              <View style={styles.modalCentered}>
                <AppIcon name="calendarBusy" size={40} color={C.muted} />
                <Text style={styles.emptyText}>Sin horarios establecidos</Text>
              </View>
            ) : (
              <ScheduleGrid schedules={data ?? []} />
            )
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Contract card ─────────────────────────────────────────

interface ContractCardProps {
  item: Contract;
  onViewSchedule: () => void;
}

function ContractCard({ item, onViewSchedule }: ContractCardProps) {
  const color = statusColor(item.contract_status);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const url = await getContractLatestDocUrl(item.id);
      console.log('[Download] URL recibida:', url);
      await Linking.openURL(url);
    } catch (err: any) {
      const status = err?.response?.status;
      const detail = err?.response?.data?.detail ?? err?.message ?? 'Error desconocido';
      console.error('[Download] Error:', status, detail);

      if (status === 404) {
        Alert.alert('Sin documento', 'Este contrato aún no tiene un documento generado. Contacta a tu administrador.');
      } else if (status === 403) {
        Alert.alert('Sin acceso', 'No tienes permiso para descargar este documento.');
      } else {
        Alert.alert('Error', `No se pudo descargar el documento (${status ?? 'sin conexión'}).`);
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <AppIcon name="contract" size={15} color={C.accent} />
          <Text style={styles.cardTitle} numberOfLines={2}>{item.contract_name}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: color }]}>
          <Text style={[styles.statusText, { color }]}>{capitalize(item.contract_status)}</Text>
        </View>
      </View>

      <Text style={styles.cardCharge}>{item.charge_name}</Text>

      <View style={styles.cardTagRow}>
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{capitalize(item.contract_type)}</Text>
        </View>
        <View style={styles.cardTag}>
          <Text style={styles.cardTagText}>{capitalize(item.salary_type)}</Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardInfoRow}>
        <AppIcon name="calendarRange" size={13} color={C.muted} />
        <Text style={styles.cardMuted}>
          {formatDate(item.start_date)}
          {item.end_date ? ` → ${formatDate(item.end_date)}` : ''}
        </Text>
      </View>

      <View style={styles.cardInfoRow}>
        <AppIcon name="money" size={13} color={C.muted} />
        <Text style={styles.cardMuted}>Base: {formatSalary(item.salary_base)}</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.downloadBtn, downloading && { opacity: 0.6 }]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading
            ? <ActivityIndicator size="small" color={C.accent} />
            : <AppIcon name="download" size={15} color={C.accent} />
          }
          {!downloading && <Text style={styles.downloadBtnText}>Descargar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.scheduleBtn} onPress={onViewSchedule}>
          <AppIcon name="clockTime" size={15} color={C.accent} />
          <Text style={styles.scheduleBtnText}>Ver horarios</Text>
          <AppIcon name="chevronRight" size={16} color={C.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Filter modal ──────────────────────────────────────────

interface FilterModalProps {
  visible: boolean;
  current: FilterState;
  onApply: (f: FilterState) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: StatusFilter[] = ['todos', 'activo', 'inactivo', 'suspendido'];

function FilterModal({ visible, current, onApply, onClose }: FilterModalProps) {
  const [status, setStatus] = useState<StatusFilter>(current.status);
  const [startDate, setStartDate] = useState(current.startDate);
  const [endDate, setEndDate] = useState(current.endDate);
  const [calTarget, setCalTarget] = useState<CalendarTarget>(null);

  useEffect(() => {
    if (visible) {
      setStatus(current.status);
      setStartDate(current.startDate);
      setEndDate(current.endDate);
      setCalTarget(null);
    }
  }, [visible, current]);

  function handleDayPress(day: { dateString: string }) {
    if (calTarget === 'start') setStartDate(day.dateString);
    else setEndDate(day.dateString);
    setCalTarget(null);
  }

  function handleApply() {
    onApply({ status, startDate, endDate });
    onClose();
  }

  function handleClear() {
    setStatus('todos');
    setStartDate('');
    setEndDate('');
    setCalTarget(null);
  }

  const markedDates: Record<string, { selected: boolean; selectedColor: string }> = {};
  if (startDate) markedDates[startDate] = { selected: true, selectedColor: C.accent };
  if (endDate) markedDates[endDate] = { selected: true, selectedColor: C.accent };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <AppIcon name="close" size={22} color={C.muted} />
            </TouchableOpacity>
          </View>

          {calTarget !== null ? (
            <View style={styles.calendarWrap}>
              <Text style={styles.calLabel}>
                {calTarget === 'start' ? 'Fecha de inicio' : 'Fecha de fin'}
              </Text>
              <Calendar
                onDayPress={handleDayPress}
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
              <TouchableOpacity style={styles.calCancelBtn} onPress={() => setCalTarget(null)}>
                <Text style={styles.calCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Estado del contrato</Text>
              <View style={styles.chipsRow}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, status === s && styles.chipActive]}
                    onPress={() => setStatus(s)}
                  >
                    <Text style={[styles.chipText, status === s && styles.chipTextActive]}>
                      {capitalize(s)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Contratos desde</Text>
              <TouchableOpacity style={styles.dateField} onPress={() => setCalTarget('start')}>
                <AppIcon name="calendarToday" size={16} color={C.accent} />
                <Text style={[styles.dateFieldText, !startDate && { color: C.muted }]}>
                  {startDate ? formatDate(startDate) : 'Sin filtro'}
                </Text>
                {!!startDate && (
                  <TouchableOpacity onPress={() => setStartDate('')} hitSlop={10}>
                    <AppIcon name="close" size={16} color={C.muted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Contratos hasta</Text>
              <TouchableOpacity style={styles.dateField} onPress={() => setCalTarget('end')}>
                <AppIcon name="calendarToday" size={16} color={C.accent} />
                <Text style={[styles.dateFieldText, !endDate && { color: C.muted }]}>
                  {endDate ? formatDate(endDate) : 'Sin filtro'}
                </Text>
                {!!endDate && (
                  <TouchableOpacity onPress={() => setEndDate('')} hitSlop={10}>
                    <AppIcon name="close" size={16} color={C.muted} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              <View style={styles.filterBtnRow}>
                <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
                  <Text style={styles.clearBtnText}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <Text style={styles.applyBtnText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen content ───────────────────────────────────

function ContratosContent({ employeeId }: { employeeId: number }) {
  const [filters, setFilters] = useState<FilterState>({ status: 'todos', startDate: '', endDate: '' });
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['contracts', employeeId, filters],
    queryFn: () => getContracts({
      employeeId,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      status: filters.status === 'todos' ? undefined : filters.status,
    }),
    enabled: employeeId > 0,
  });

  const hasActiveFilters = filters.status !== 'todos' || !!filters.startDate || !!filters.endDate;

  return (
    <View style={styles.root}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Contratos</Text>
        <TouchableOpacity
          style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
          onPress={() => setFilterVisible(true)}
        >
          <AppIcon name="filter" size={20} color={hasActiveFilters ? C.bg : C.accent} />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      )}

      {isError && (
        <View style={styles.centered}>
          <AppIcon name="wifiOff" size={40} color={C.muted} />
          <Text style={styles.emptyText}>No se pudieron cargar los contratos</Text>
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
            <ContractCard item={item} onViewSchedule={() => setSelectedContract(item)} />
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
              <AppIcon name="contract" size={48} color={C.muted} />
              <Text style={styles.emptyText}>No tienes contratos registrados</Text>
              {hasActiveFilters && (
                <Text style={styles.emptySubtext}>Prueba ajustando los filtros</Text>
              )}
            </View>
          }
        />
      )}

      <FilterModal
        visible={filterVisible}
        current={filters}
        onApply={setFilters}
        onClose={() => setFilterVisible(false)}
      />
      <ScheduleModal
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
      />
    </View>
  );
}

// ── Root export ───────────────────────────────────────────

export default function ContratosScreen() {
  const { user } = useAuthStore();
  if (!user) return <LoginScreen />;
  if (!user.id_employee) {
    return (
      <View style={[styles.root, styles.centered]}>
        <AppIcon name="personOff" size={40} color={C.muted} />
        <Text style={styles.emptyText}>Sin empleado vinculado</Text>
        <Text style={styles.emptySubtext}>Tu cuenta no está asociada a un empleado.</Text>
      </View>
    );
  }
  return <ContratosContent employeeId={user.id_employee} />;
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
  filterBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.accentBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: C.accent, borderColor: C.accent,
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
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, fontFamily: F?.demi, flex: 1 },
  cardCharge: { fontSize: 13, color: C.muted, fontFamily: F?.regular },
  cardTagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  cardTag: {
    backgroundColor: C.accentGlow, borderWidth: 1, borderColor: C.accentBorder,
    borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10,
  },
  cardTagText: { fontSize: 11, color: C.accent, fontFamily: F?.demi },
  cardDivider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 2 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMuted: { fontSize: 13, color: C.muted, fontFamily: F?.regular },
  statusBadge: {
    borderWidth: 1, borderRadius: 20,
    paddingVertical: 3, paddingHorizontal: 10,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, fontFamily: F?.demi },
  cardActions: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 4,
  },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: C.accentBorder,
    backgroundColor: C.accentGlow, minWidth: 44, justifyContent: 'center',
  },
  downloadBtnText: { fontSize: 13, color: C.accent, fontFamily: F?.demi },
  scheduleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 20, borderWidth: 1, borderColor: C.accentBorder,
    backgroundColor: C.accentGlow,
  },
  scheduleBtnText: { fontSize: 13, color: C.accent, fontFamily: F?.demi },

  // Error / retry
  retryBtn: {
    marginTop: 4, paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 20, borderWidth: 1, borderColor: C.accentBorder,
  },
  retryText: { color: C.accent, fontSize: 14, fontFamily: F?.demi },

  // Modal shared
  modalCentered: { alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, paddingTop: 40 },
  overlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: C.modalBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.cardBorder,
  },
  modalTitleWrap: { flex: 1, gap: 2 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, fontFamily: F?.demi },
  modalSubtitle: { fontSize: 13, color: C.muted, fontFamily: F?.regular },

  // Filter modal
  formScroll: { paddingHorizontal: 20, paddingTop: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: C.muted,
    letterSpacing: 1.2, textTransform: 'uppercase', fontFamily: F?.demi, marginBottom: 8,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.card,
  },
  chipActive: { backgroundColor: C.accentGlow, borderColor: C.accentBorder },
  chipText: { fontSize: 13, color: C.muted, fontFamily: F?.regular },
  chipTextActive: { color: C.accent, fontFamily: F?.demi },
  dateField: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.accentBorder,
    borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 16,
  },
  dateFieldText: { fontSize: 15, color: C.text, fontFamily: F?.regular, flex: 1 },
  filterBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  clearBtn: {
    flex: 1, paddingVertical: 13, borderRadius: 14,
    borderWidth: 1, borderColor: C.cardBorder, alignItems: 'center',
  },
  clearBtnText: { fontSize: 14, color: C.muted, fontFamily: F?.demi },
  applyBtn: {
    flex: 2, paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.accent, alignItems: 'center',
  },
  applyBtnText: { fontSize: 14, fontWeight: '700', color: C.bg, fontFamily: F?.demi },

  // Calendar
  calendarWrap: { paddingHorizontal: 12 },
  calLabel: {
    fontSize: 13, color: C.muted, fontFamily: F?.demi,
    paddingHorizontal: 8, paddingVertical: 12,
  },
  calCancelBtn: { alignItems: 'center', paddingVertical: 14 },
  calCancelText: { color: C.muted, fontSize: 14, fontFamily: F?.regular },
});

// ── Schedule grid styles ──────────────────────────────────

const grid = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  hourCol: { width: 48, alignItems: 'flex-end', paddingRight: 6 },
  hourText: { fontSize: 10, color: C.muted, fontFamily: F?.regular },
  dayCol: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  dayText: { fontSize: 11, fontWeight: '700', color: C.muted, fontFamily: F?.demi },
  cell: {
    flex: 1, height: 26, marginHorizontal: 1, borderRadius: 3,
    borderWidth: 0.5, borderColor: 'rgba(237,244,255,0.06)',
    backgroundColor: 'rgba(237,244,255,0.02)',
  },
  cellCovered: {
    backgroundColor: 'rgba(0,229,204,0.22)',
    borderColor: 'rgba(0,229,204,0.38)',
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginLeft: 54 },
  legendDot: {
    width: 14, height: 14, borderRadius: 3,
    backgroundColor: 'rgba(0,229,204,0.22)',
    borderWidth: 1, borderColor: 'rgba(0,229,204,0.38)',
  },
  legendText: { fontSize: 12, color: C.muted, fontFamily: F?.regular },
});
