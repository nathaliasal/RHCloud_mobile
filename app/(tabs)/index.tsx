import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import NotificationSidebar, { BellButton } from '@/components/notification-sidebar';
import { AppIcon } from '@/components/ui/app-icon';
import { IconName } from '@/constants/icons';

const { width } = Dimensions.get('window');

// ── Palette ──────────────────────────────────────────────
const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.15)',
  accentBorder: 'rgba(0,229,204,0.35)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.50)',
  orb1: 'rgba(0,180,216,0.16)',
  orb2: 'rgba(100,30,200,0.13)',
};

// ── Font helpers ──────────────────────────────────────────
const F = Platform.select({
  ios: {
    heavy: 'AvenirNext-Heavy',
    bold: 'AvenirNext-Bold',
    demi: 'AvenirNext-DemiBold',
    regular: 'AvenirNext-Regular',
  },
  default: {
    heavy: 'sans-serif-condensed',
    bold: 'sans-serif-medium',
    demi: 'sans-serif-medium',
    regular: 'sans-serif',
  },
});

// ── Feature data ──────────────────────────────────────────
const FEATURES: {
  icon: IconName;
  title: string;
  description: string;
  accent: string;
  bg: string;
  border: string;
}[] = [
  {
    icon: 'featureContracts',
    title: 'Contratos',
    description:
      'Consulta y revisa tus contratos laborales vigentes en cualquier momento y desde cualquier lugar.',
    accent: '#00E5CC',
    bg: 'rgba(0,229,204,0.09)',
    border: 'rgba(0,229,204,0.28)',
  },
  {
    icon: 'featureSchedule',
    title: 'Horarios',
    description:
      'Accede al calendario de turnos y horarios de cada contrato siempre actualizado en tiempo real.',
    accent: '#4FC3F7',
    bg: 'rgba(79,195,247,0.09)',
    border: 'rgba(79,195,247,0.28)',
  },
  {
    icon: 'featureLeave',
    title: 'Permisos y Vacaciones',
    description:
      'Solicita días de permiso o vacaciones directamente desde la app y haz seguimiento de su estado.',
    accent: '#6EE7B7',
    bg: 'rgba(110,231,183,0.09)',
    border: 'rgba(110,231,183,0.28)',
  },
  {
    icon: 'featureNotifs',
    title: 'Notificaciones',
    description:
      'Recibe alertas en tiempo real sobre contratos, horarios y el estado de todas tus solicitudes.',
    accent: '#FFB74D',
    bg: 'rgba(255,183,77,0.09)',
    border: 'rgba(255,183,77,0.28)',
  },
];

// ── Feature Card ──────────────────────────────────────────
function FeatureCard({
  item,
  index,
}: {
  item: (typeof FEATURES)[0];
  index: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(28);

  useEffect(() => {
    const delay = 500 + index * 160;
    opacity.value = withDelay(delay, withTiming(1, { duration: 480 }));
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 22, stiffness: 95 })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.card,
        { backgroundColor: item.bg, borderColor: item.border },
        animStyle,
      ]}
    >
      <View style={[styles.cardIconWrap, { backgroundColor: item.bg }]}>
        <AppIcon name={item.icon} size={26} color={item.accent} />
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: item.accent }]}>
          {item.title}
        </Text>
        <Text style={styles.cardDesc}>{item.description}</Text>
      </View>
    </Animated.View>
  );
}

// ── Home / Welcome Tab ────────────────────────────────────
export default function HomeScreen() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(-18);
  const logoScale = useSharedValue(0.75);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    heroOpacity.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
    heroY.value = withSpring(0, { damping: 22, stiffness: 85 });
    logoScale.value = withDelay(
      120,
      withSpring(1, { damping: 14, stiffness: 110 })
    );
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [1, 1.12], [0.5, 0.15]),
  }));

  return (
    <View style={styles.root}>
      {/* Decorative orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

      {/* Bell button ── top-right floating */}
      <View style={styles.bellWrap}>
        <BellButton onPress={() => setSidebarOpen(true)} />
      </View>

      {/* Notification Sidebar */}
      <NotificationSidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <Animated.View style={[styles.hero, heroStyle]}>
          <Animated.View style={[styles.logoPulseRing, ringStyle]} />

          <Animated.View style={[styles.logoMark, logoStyle]}>
            <Text style={styles.logoText}>RH</Text>
            <View style={styles.logoDot} />
          </Animated.View>

          <Text style={styles.appName}>RHCloud</Text>

          <Text style={styles.tagline}>
            Tu gestión laboral,{'\n'}siempre contigo
          </Text>

          <View style={styles.rule} />

          <Text style={styles.subtitle}>
            Todo lo que necesitas de Recursos Humanos en un solo lugar, al
            alcance de tu mano.
          </Text>
        </Animated.View>

        {/* ── Features ── */}
        <View style={styles.featuresSection}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelLine} />
            <Text style={styles.sectionLabel}>FUNCIONALIDADES</Text>
            <View style={styles.sectionLabelLine} />
          </View>

          {FEATURES.map((item, i) => (
            <FeatureCard key={item.title} item={item} index={i} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  orb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: C.orb1,
    top: -90,
    right: -80,
  },
  orb2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: C.orb2,
    bottom: 160,
    left: -90,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,229,204,0.06)',
    bottom: 40,
    right: -40,
  },
  bellWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 42,
    right: 22,
    zIndex: 10,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 72 : 52,
    paddingBottom: 48,
  },

  // ── Hero
  hero: {
    alignItems: 'center',
    marginBottom: 52,
  },
  logoPulseRing: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 1.5,
    borderColor: C.accent,
    top: -14,
  },
  logoMark: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: C.accentGlow,
    borderWidth: 1.2,
    borderColor: C.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  logoText: {
    fontSize: 30,
    fontWeight: '900',
    color: C.accent,
    letterSpacing: -1,
    fontFamily: F?.heavy,
  },
  logoDot: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: C.accent,
    bottom: 11,
    right: 11,
  },
  appName: {
    fontSize: 40,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -1.2,
    fontFamily: F?.heavy,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
    lineHeight: 31,
    letterSpacing: -0.4,
    fontFamily: F?.demi,
    marginBottom: 20,
  },
  rule: {
    width: 36,
    height: 2.5,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginBottom: 20,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 15,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 23,
    maxWidth: width * 0.78,
    fontFamily: F?.regular,
  },

  // ── Features
  featuresSection: {
    marginBottom: 44,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  sectionLabelLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 3,
    fontFamily: F?.bold,
    opacity: 0.85,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 11,
    gap: 13,
    overflow: 'hidden',
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    paddingTop: 2,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 5,
    fontFamily: F?.demi,
  },
  cardDesc: {
    fontSize: 13.5,
    color: C.muted,
    lineHeight: 20,
    fontFamily: F?.regular,
  },
});
