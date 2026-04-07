import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = Math.min(SCREEN_W * 0.82, 340);

// ── Palette ───────────────────────────────────────────────
const C = {
  bg: '#07101F',
  panel: '#0D1B2E',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.12)',
  accentBorder: 'rgba(0,229,204,0.25)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.50)',
  divider: 'rgba(237,244,255,0.07)',
  backdrop: 'rgba(0,0,0,0.60)',
  badgeBg: '#00E5CC',
  badgeText: '#07101F',
};

// ── Font helpers ──────────────────────────────────────────
const F = Platform.select({
  ios: {
    bold: 'AvenirNext-Bold',
    demi: 'AvenirNext-DemiBold',
    regular: 'AvenirNext-Regular',
  },
  default: {
    bold: 'sans-serif-medium',
    demi: 'sans-serif-medium',
    regular: 'sans-serif',
  },
});

// ── Notification types ────────────────────────────────────
type NotifType = 'approved' | 'pending' | 'rejected' | 'info' | 'schedule';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const TYPE_META: Record<NotifType, { color: string; bg: string; icon: string }> = {
  approved: {
    color: '#6EE7B7',
    bg: 'rgba(110,231,183,0.12)',
    icon: '✅',
  },
  pending: {
    color: '#FFB74D',
    bg: 'rgba(255,183,77,0.12)',
    icon: '⏳',
  },
  rejected: {
    color: '#FF6B6B',
    bg: 'rgba(255,107,107,0.12)',
    icon: '❌',
  },
  info: {
    color: '#00E5CC',
    bg: 'rgba(0,229,204,0.12)',
    icon: '📋',
  },
  schedule: {
    color: '#4FC3F7',
    bg: 'rgba(79,195,247,0.12)',
    icon: '🗓️',
  },
};

// ── Mock data ─────────────────────────────────────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'approved',
    title: 'Permiso aprobado',
    body: 'Tu solicitud de permiso del 10 al 12 de abril fue aprobada.',
    time: 'Hace 2 horas',
    read: false,
  },
  {
    id: '2',
    type: 'pending',
    title: 'Solicitud en revisión',
    body: 'Tu solicitud de vacaciones del 20 al 28 de abril está siendo revisada.',
    time: 'Hace 5 horas',
    read: false,
  },
  {
    id: '3',
    type: 'schedule',
    title: 'Horario actualizado',
    body: 'Tu turno del jueves 10 fue cambiado de 08:00 a 06:00 AM.',
    time: 'Ayer',
    read: false,
  },
  {
    id: '4',
    type: 'info',
    title: 'Contrato renovado',
    body: 'Tu contrato fue renovado hasta el 31 de diciembre de 2026.',
    time: 'Hace 2 días',
    read: true,
  },
  {
    id: '5',
    type: 'rejected',
    title: 'Permiso rechazado',
    body: 'Tu solicitud de permiso del 3 de abril fue rechazada por tu supervisor.',
    time: 'Hace 3 días',
    read: true,
  },
  {
    id: '6',
    type: 'info',
    title: 'Nuevo documento disponible',
    body: 'Tu desprendible de nómina de marzo ya está disponible.',
    time: 'Hace 5 días',
    read: true,
  },
];

const UNREAD_COUNT = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

// ── Bell icon (SVG-less, drawn with Unicode + styles) ─────
export function BellButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={bellStyles.wrap}
      activeOpacity={0.7}
    >
      <Text style={bellStyles.icon}>🔔</Text>
      {UNREAD_COUNT > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>
            {UNREAD_COUNT > 9 ? '9+' : UNREAD_COUNT}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const bellStyles = StyleSheet.create({
  wrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: C.accentGlow,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  icon: {
    fontSize: 18,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.badgeBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: C.badgeText,
    fontFamily: F?.bold,
  },
});

// ── Notification Item ─────────────────────────────────────
function NotifItem({ notif }: { notif: Notification }) {
  const meta = TYPE_META[notif.type];
  return (
    <View style={[itemStyles.wrap, notif.read && itemStyles.wrapRead]}>
      <View style={[itemStyles.iconWrap, { backgroundColor: meta.bg }]}>
        <Text style={itemStyles.icon}>{meta.icon}</Text>
      </View>
      <View style={itemStyles.body}>
        <View style={itemStyles.titleRow}>
          <Text
            style={[itemStyles.title, { color: notif.read ? C.muted : C.text }]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          {!notif.read && (
            <View style={[itemStyles.unreadDot, { backgroundColor: meta.color }]} />
          )}
        </View>
        <Text style={itemStyles.bodyText} numberOfLines={2}>
          {notif.body}
        </Text>
        <Text style={[itemStyles.time, { color: meta.color }]}>{notif.time}</Text>
      </View>
    </View>
  );
}

const itemStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  wrapRead: {
    opacity: 0.65,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  body: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    fontFamily: F?.demi,
    flex: 1,
    marginRight: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  bodyText: {
    fontSize: 12.5,
    color: C.muted,
    lineHeight: 18,
    fontFamily: F?.regular,
    marginBottom: 5,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: F?.demi,
  },
});

// ── Main Sidebar Component ────────────────────────────────
interface NotificationSidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSidebar({
  visible,
  onClose,
}: NotificationSidebarProps) {
  const translateX = useSharedValue(SIDEBAR_W);
  const backdropOpacity = useSharedValue(0);

  const open = () => {
    translateX.value = withTiming(0, {
      duration: 320,
      easing: Easing.out(Easing.cubic),
    });
    backdropOpacity.value = withTiming(1, { duration: 300 });
  };

  const close = (callback?: () => void) => {
    translateX.value = withTiming(
      SIDEBAR_W,
      { duration: 280, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished && callback) runOnJS(callback)();
      }
    );
    backdropOpacity.value = withTiming(0, { duration: 260 });
  };

  useEffect(() => {
    if (visible) {
      open();
    }
  }, [visible]);

  const handleClose = () => {
    close(onClose);
  };

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Panel */}
        <Animated.View style={[styles.panel, panelStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>🔔</Text>
              <Text style={styles.headerTitle}>Notificaciones</Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Unread summary */}
          {UNREAD_COUNT > 0 && (
            <View style={styles.summaryBar}>
              <View style={styles.summaryDot} />
              <Text style={styles.summaryText}>
                {UNREAD_COUNT} sin leer
              </Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.markAllText}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* List */}
          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {MOCK_NOTIFICATIONS.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔕</Text>
                <Text style={styles.emptyTitle}>Sin notificaciones</Text>
                <Text style={styles.emptyBody}>
                  Cuando tengas notificaciones aparecerán aquí.
                </Text>
              </View>
            ) : (
              MOCK_NOTIFICATIONS.map((notif) => (
                <NotifItem key={notif.id} notif={notif} />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: C.backdrop,
  },
  panel: {
    width: SIDEBAR_W,
    height: '100%',
    backgroundColor: C.panel,
    borderLeftWidth: 1,
    borderLeftColor: C.accentBorder,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  headerIcon: {
    fontSize: 19,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
    fontFamily: F?.bold,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(237,244,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '700',
  },

  // Summary bar
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  summaryDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: C.accent,
  },
  summaryText: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '600',
    fontFamily: F?.demi,
    flex: 1,
  },
  markAllText: {
    fontSize: 11,
    color: C.muted,
    fontFamily: F?.regular,
    textDecorationLine: 'underline',
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },

  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
    fontFamily: F?.bold,
    opacity: 0.6,
  },
  emptyBody: {
    fontSize: 13,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: F?.regular,
  },
});
