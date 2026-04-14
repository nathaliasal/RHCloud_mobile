import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { markNotificationAsRead, NotificationRecord } from '@/services/notifications';
import { useNotificationsStore } from '@/stores/notifications';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDEBAR_W = Math.min(SCREEN_W * 0.82, 340);

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
  error: '#FF6B6B',
};

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

type NotifType = 'approved' | 'pending' | 'rejected' | 'info' | 'schedule';

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

function resolveNotificationType(notification: NotificationRecord): NotifType {
  const lookup = [
    notification.event_type,
    notification.status,
    notification.title,
    notification.message,
  ]
    .join(' ')
    .toLowerCase();

  if (lookup.includes('rechaz')) return 'rejected';
  if (lookup.includes('aprob')) return 'approved';
  if (lookup.includes('pend')) return 'pending';
  if (
    lookup.includes('schedule') ||
    lookup.includes('horario') ||
    lookup.includes('turno')
  ) {
    return 'schedule';
  }

  return 'info';
}

function formatNotificationTime(createdAt: string): string {
  try {
    return formatDistanceToNow(parseISO(createdAt), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    return 'Hace un momento';
  }
}

function realtimeLabel(status: ReturnType<typeof useNotificationsStore.getState>['realtimeStatus']) {
  switch (status) {
    case 'connected':
      return 'Tiempo real activo';
    case 'connecting':
      return 'Conectando realtime';
    case 'reconnecting':
      return 'Reconectando realtime';
    case 'error':
      return 'Realtime con incidencia';
    default:
      return 'Realtime inactivo';
  }
}

export function BellButton({ onPress }: { onPress: () => void }) {
  const unreadCount = useNotificationsStore((state) => state.unreadCount);

  return (
    <TouchableOpacity onPress={onPress} style={bellStyles.wrap} activeOpacity={0.7}>
      <Text style={bellStyles.icon}>🔔</Text>
      {unreadCount > 0 && (
        <View style={bellStyles.badge}>
          <Text style={bellStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function NotifItem({
  notif,
  onPress,
  loading,
}: {
  notif: NotificationRecord;
  onPress: () => void;
  loading: boolean;
}) {
  const meta = TYPE_META[resolveNotificationType(notif)];

  return (
    <TouchableOpacity
      style={[itemStyles.wrap, notif.is_read && itemStyles.wrapRead]}
      activeOpacity={0.78}
      onPress={onPress}
      disabled={notif.is_read || loading}
    >
      <View style={[itemStyles.iconWrap, { backgroundColor: meta.bg }]}>
        <Text style={itemStyles.icon}>{meta.icon}</Text>
      </View>
      <View style={itemStyles.body}>
        <View style={itemStyles.titleRow}>
          <Text
            style={[itemStyles.title, { color: notif.is_read ? C.muted : C.text }]}
            numberOfLines={1}
          >
            {notif.title}
          </Text>
          {!notif.is_read && (
            <View style={[itemStyles.unreadDot, { backgroundColor: meta.color }]} />
          )}
        </View>
        <Text style={itemStyles.bodyText} numberOfLines={2}>
          {notif.message}
        </Text>
        <View style={itemStyles.footerRow}>
          <Text style={[itemStyles.time, { color: meta.color }]}>
            {formatNotificationTime(notif.created_at)}
          </Text>
          {!notif.is_read && (
            <Text style={itemStyles.markHint}>{loading ? 'Guardando...' : 'Toca para leer'}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

interface NotificationSidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function NotificationSidebar({
  visible,
  onClose,
}: NotificationSidebarProps) {
  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const loading = useNotificationsStore((state) => state.loading);
  const initialized = useNotificationsStore((state) => state.initialized);
  const error = useNotificationsStore((state) => state.error);
  const realtimeStatus = useNotificationsStore((state) => state.realtimeStatus);
  const markAsReadLocal = useNotificationsStore((state) => state.markAsReadLocal);

  const [pendingReadId, setPendingReadId] = useState<number | null>(null);

  const translateX = useSharedValue(SIDEBAR_W);
  const backdropOpacity = useSharedValue(0);

  const close = (callback?: () => void) => {
    translateX.value = withTiming(
      SIDEBAR_W,
      { duration: 280, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished && callback) runOnJS(callback)();
      },
    );
    backdropOpacity.value = withTiming(0, { duration: 260 });
  };

  useEffect(() => {
    if (visible) {
      translateX.value = withTiming(0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [backdropOpacity, translateX, visible]);

  const handleClose = () => {
    close(onClose);
  };

  const handleNotificationPress = async (notification: NotificationRecord) => {
    if (notification.is_read || pendingReadId === notification.id) return;

    setPendingReadId(notification.id);
    try {
      await markNotificationAsRead(notification.id);
      markAsReadLocal(notification.id);
    } catch (readError) {
      console.warn('[Notifications] mark as read failed', readError);
    } finally {
      setPendingReadId((current) => (current === notification.id ? null : current));
    }
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
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, panelStyle]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerIcon}>🔔</Text>
              <View>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <Text style={styles.headerSub}>{realtimeLabel(realtimeStatus)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBar}>
            <View style={styles.summaryDot} />
            <Text style={styles.summaryText}>
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al dia'}
            </Text>
            <Text style={styles.summaryHint}>Toca una notificacion para marcarla</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {loading && !initialized ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="small" color={C.accent} />
                <Text style={styles.stateText}>Cargando notificaciones...</Text>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🔕</Text>
                <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              </View>
            ) : (
              items.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  loading={pendingReadId === notif.id}
                  onPress={() => void handleNotificationPress(notif)}
                />
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  time: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: F?.demi,
  },
  markHint: {
    fontSize: 10.5,
    color: C.muted,
    fontFamily: F?.regular,
  },
});

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
  headerSub: {
    fontSize: 11,
    color: C.muted,
    fontFamily: F?.regular,
    marginTop: 2,
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
  summaryBar: {
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
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: C.accent,
    fontWeight: '600',
    fontFamily: F?.demi,
    marginBottom: 2,
  },
  summaryHint: {
    fontSize: 11,
    color: C.muted,
    fontFamily: F?.regular,
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  errorText: {
    color: C.error,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: F?.regular,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 52,
    gap: 12,
  },
  stateText: {
    fontSize: 13,
    color: C.muted,
    fontFamily: F?.regular,
  },
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
