import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import { resetPassword } from '@/services/auth';

// ── Palette ───────────────────────────────────────────────
const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.15)',
  accentBorder: 'rgba(0,229,204,0.35)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.50)',
  orb1: 'rgba(0,180,216,0.16)',
  orb2: 'rgba(100,30,200,0.13)',
  inputBg: 'rgba(255,255,255,0.055)',
  inputBorder: 'rgba(255,255,255,0.09)',
  inputFocus: 'rgba(0,229,204,0.35)',
  error: '#FF6B6B',
  success: '#4ADE80',
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

// ── Campo de texto ────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  delay = 0,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 450 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 90 }));
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.fieldWrap, wrapStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          focused && { borderColor: C.inputFocus },
        ]}
      >
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </Animated.View>
  );
}

// ── Reset Password Screen ─────────────────────────────────
export default function ResetPasswordScreen() {
  // El token llega como query param del deep link:
  // rhcloudmobile://reset-password?token=xxx
  const { token } = useLocalSearchParams<{ token: string }>();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(-14);
  const btnProgress = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    heroY.value = withSpring(0, { damping: 22, stiffness: 85 });
    btnProgress.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnProgress.value,
    transform: [{ translateY: interpolate(btnProgress.value, [0, 1], [12, 0]) }],
  }));

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleReset = async () => {
    if (loading || !passwordsMatch || !token) return;
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword, confirmPassword);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al restablecer la contraseña';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <Animated.View style={[styles.hero, heroStyle]}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>RH</Text>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.appName}>RHCloud</Text>
            <Text style={styles.tagline}>Nueva contraseña</Text>
            <View style={styles.rule} />
            <Text style={styles.subtitle}>
              Ingresa y confirma tu nueva contraseña para recuperar el acceso.
            </Text>
          </Animated.View>

          {/* ── Formulario ── */}
          <View style={styles.formCard}>
            {success ? (
              <>
                <View style={styles.successBox}>
                  <Text style={styles.successText}>
                    Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.
                  </Text>
                </View>
                <Animated.View style={btnStyle}>
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    activeOpacity={0.82}
                    onPress={() => router.replace('/(tabs)/login')}
                  >
                    <Text style={styles.btnLabel}>Ir al inicio de sesión</Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <>
                {!token && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                      Enlace inválido. Solicita un nuevo correo de recuperación.
                    </Text>
                  </View>
                )}

                <Field
                  label="Nueva contraseña"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry
                  delay={200}
                />

                <Field
                  label="Confirmar contraseña"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite la nueva contraseña"
                  secureTextEntry
                  delay={350}
                />

                {/* Indicador de coincidencia */}
                {confirmPassword.length > 0 && (
                  <Text
                    style={[
                      styles.matchHint,
                      { color: passwordsMatch ? C.success : C.error },
                    ]}
                  >
                    {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </Text>
                )}

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Animated.View style={btnStyle}>
                  <TouchableOpacity
                    style={[
                      styles.btnPrimary,
                      (!passwordsMatch || loading || !token) && styles.btnDisabled,
                    ]}
                    activeOpacity={0.82}
                    onPress={handleReset}
                    disabled={!passwordsMatch || loading || !token}
                  >
                    {loading ? (
                      <ActivityIndicator color="#07101F" size="small" />
                    ) : (
                      <Text style={styles.btnLabel}>Restablecer contraseña</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => router.replace('/(tabs)/login')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.backLinkText}>Volver al inicio de sesión</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  kav: { flex: 1 },
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
    bottom: 140,
    left: -80,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 72 : 52,
    paddingBottom: 48,
  },

  // ── Hero
  hero: { alignItems: 'center', marginBottom: 40 },
  logoMark: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: C.accentGlow,
    borderWidth: 1.2,
    borderColor: C.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    color: C.accent,
    letterSpacing: -1,
    fontFamily: F?.heavy,
  },
  logoDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.accent,
    bottom: 10,
    right: 10,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -1.2,
    fontFamily: F?.heavy,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    color: C.text,
    fontFamily: F?.demi,
    marginBottom: 14,
  },
  rule: {
    width: 32,
    height: 2.5,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginBottom: 14,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 13.5,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
    fontFamily: F?.regular,
  },

  // ── Form
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    gap: 8,
  },
  fieldWrap: { marginBottom: 10 },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 1.5,
    fontFamily: F?.bold,
    marginBottom: 8,
    opacity: 0.9,
  },
  inputBox: {
    backgroundColor: C.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 15 : 12,
  },
  input: {
    fontSize: 15,
    color: C.text,
    fontFamily: F?.regular,
  },
  matchHint: {
    fontSize: 12,
    fontFamily: F?.regular,
    marginTop: -4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  // ── Error / Success
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    fontFamily: F?.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  successBox: {
    backgroundColor: 'rgba(74,222,128,0.10)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.30)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  successText: {
    color: C.success,
    fontSize: 13.5,
    fontFamily: F?.regular,
    textAlign: 'center',
    lineHeight: 21,
  },

  // ── Buttons
  btnPrimary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 17,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#07101F',
    letterSpacing: -0.2,
    fontFamily: F?.bold,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 13,
    color: C.accent,
    fontFamily: F?.regular,
    opacity: 0.8,
  },
});
