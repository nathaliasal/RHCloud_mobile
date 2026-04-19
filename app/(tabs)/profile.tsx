import { clearTokens } from '@/services/auth';
import { getMyProfile } from '@/services/persons';
import { useAuthStore } from '@/stores/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LoginScreen from './login';

// ── Palette ───────────────────────────────────────────────
const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.15)',
  accentBorder: 'rgba(0,229,204,0.35)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.50)',
  mutedLight: 'rgba(237,244,255,0.12)',
  orb1: 'rgba(0,180,216,0.16)',
  orb2: 'rgba(100,30,200,0.13)',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBorder: 'rgba(255,255,255,0.07)',
  rowBorder: 'rgba(255,255,255,0.05)',
  error: '#FF6B6B',
  logoutBg: 'rgba(255,107,107,0.08)',
  logoutBorder: 'rgba(255,107,107,0.25)',
};

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

// ── Info Row ──────────────────────────────────────────────
function InfoRow({ label, value, delay = 0 }: { label: string; value?: string; delay?: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 100 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.row, animStyle]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, !value && styles.rowValueEmpty]}>
        {value || '—'}
      </Text>
    </Animated.View>
  );
}

// ── Section ───────────────────────────────────────────────
function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animStyle}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionLine} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionLine} />
      </View>
      <View style={styles.card}>{children}</View>
    </Animated.View>
  );
}

// ── Profile Screen ────────────────────────────────────────
export default function ProfileScreen() {
  const { user, clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    staleTime: 1000 * 60 * 5,
    enabled: !!user,
  });

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-14);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerY.value = withSpring(0, { damping: 22, stiffness: 85 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const actionsStyle = useAnimatedStyle(() => ({
    opacity: withDelay(860, withTiming(1, { duration: 400 })),
  }));

  // Auth guard — after ALL hooks
  if (!user) return <LoginScreen />;

  const handleLogout = async () => {
    await clearTokens();
    clearUser();
    queryClient.clear();
    router.replace('/(tabs)/login');
  };

  // Nombre a mostrar: del perfil personal o del auth/me
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : user?.full_name ?? 'Usuario';

  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.root}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, headerStyle]}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          {user?.role && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          )}
          <Text style={styles.email}>{profile?.email ?? user?.email ?? ''}</Text>
        </Animated.View>

        {/* ── Loading ── */}
        {isLoading && (
          <View style={styles.centered}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={styles.loadingText}>Cargando perfil...</Text>
          </View>
        )}

        {/* ── Error ── */}
        {isError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
            <TouchableOpacity onPress={() => refetch()} activeOpacity={0.7}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Datos del perfil ── */}
        {profile && (
          <>
            <Section title="DATOS PERSONALES" delay={200}>
              <InfoRow label="Nombre(s)" value={profile.first_name} delay={250} />
              <InfoRow label="Apellido(s)" value={profile.last_name} delay={300} />
              <InfoRow label="Correo" value={profile.email} delay={350} />
              <InfoRow label="Género" value={profile.gender} delay={400} />
              <InfoRow label="Fecha de nacimiento" value={profile.birth_date} delay={450} />
            </Section>

            <Section title="DOCUMENTO" delay={480}>
              <InfoRow label="Tipo" value={profile.document_type} delay={530} />
              <InfoRow label="Número" value={profile.document_number} delay={580} />
            </Section>

            <Section title="UBICACIÓN Y CONTACTO" delay={610}>
              <InfoRow label="Departamento" value={profile.code_department} delay={660} />
              <InfoRow label="Ciudad" value={profile.code_city} delay={710} />
              <InfoRow label="Teléfono" value={profile.phone} delay={760} />
              <InfoRow label="Dirección" value={profile.address} delay={810} />
            </Section>
          </>
        )}

        {/* ── Acciones ── */}
        <Animated.View style={[styles.actionsWrap, actionsStyle]}>
          <TouchableOpacity
            style={styles.btnChangePassword}
            activeOpacity={0.8}
            onPress={() => router.push('/change-password')}
          >
            <Text style={styles.btnChangePasswordText}>Cambiar contraseña</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnLogout}
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <Text style={styles.btnLogoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: C.orb1,
    top: -80,
    right: -70,
  },
  orb2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: C.orb2,
    bottom: 180,
    left: -80,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 100,
  },

  // ── Header
  header: { alignItems: 'center', marginBottom: 32 },
  editBtn: {
    alignSelf: 'flex-end',
    backgroundColor: C.accentGlow,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.accent,
    fontFamily: F?.demi,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: C.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: C.accent,
    fontFamily: F?.heavy,
    letterSpacing: -0.5,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    color: C.text,
    fontFamily: F?.heavy,
    letterSpacing: -0.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: C.accentGlow,
    borderWidth: 1,
    borderColor: C.accentBorder,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.accent,
    fontFamily: F?.bold,
    letterSpacing: 1.5,
  },
  email: {
    fontSize: 13,
    color: C.muted,
    fontFamily: F?.regular,
  },

  // ── Loading / Error
  centered: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: C.muted, fontSize: 14, fontFamily: F?.regular },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.25)',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  errorText: { color: C.error, fontSize: 13, fontFamily: F?.regular, textAlign: 'center' },
  retryText: { color: C.accent, fontSize: 13, fontFamily: F?.demi },

  // ── Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
    gap: 10,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 2,
    fontFamily: F?.bold,
    opacity: 0.7,
  },

  // ── Card
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // ── Row
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.rowBorder,
  },
  rowLabel: {
    fontSize: 13,
    color: C.muted,
    fontFamily: F?.regular,
    flex: 1,
  },
  rowValue: {
    fontSize: 13.5,
    color: C.text,
    fontFamily: F?.demi,
    textAlign: 'right',
    flex: 1,
  },
  rowValueEmpty: { color: C.mutedLight },

  // ── Actions
  actionsWrap: { gap: 10, marginTop: 8 },
  btnChangePassword: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accentGlow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accentBorder,
    paddingVertical: 16,
  },
  btnChangePasswordText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.accent,
    fontFamily: F?.demi,
  },

  // ── Logout
  btnLogout: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.logoutBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.logoutBorder,
    paddingVertical: 16,
    marginTop: 8,
  },
  btnLogoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.error,
    fontFamily: F?.demi,
  },
});
