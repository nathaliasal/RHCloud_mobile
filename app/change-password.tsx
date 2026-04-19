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
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { changePassword } from '@/services/users';
import { PASSWORD_RULES, isPasswordValid } from '@/utils/password';

// ── Palette ───────────────────────────────────────────────
const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.15)',
  accentBorder: 'rgba(0,229,204,0.35)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.50)',
  inputBg: 'rgba(255,255,255,0.055)',
  inputBorder: 'rgba(255,255,255,0.09)',
  inputFocus: 'rgba(0,229,204,0.35)',
  error: '#FF6B6B',
  success: '#4ADE80',
  orb1: 'rgba(0,180,216,0.16)',
  orb2: 'rgba(100,30,200,0.13)',
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

// ── Field ─────────────────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  delay = 0,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 90 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.fieldWrap, animStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={C.muted}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </Animated.View>
  );
}

// ── Password rules indicator ──────────────────────────────
function PasswordRules({ password }: { password: string }) {
  if (!password) return null;
  return (
    <View style={styles.rulesBox}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <View key={rule.id} style={styles.ruleRow}>
            <Text style={[styles.ruleDot, ok && styles.ruleDotOk]}>{ok ? '✓' : '·'}</Text>
            <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{rule.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Change Password Screen ────────────────────────────────
export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit =
    oldPassword.length > 0 &&
    isPasswordValid(newPassword) &&
    passwordsMatch &&
    !loading;

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-14);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerY.value = withSpring(0, { damping: 22, stiffness: 85 });
    btnOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const handleChange = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      await changePassword({
        old_password: oldPassword,
        password: newPassword,
        password_confirm: confirmPassword,
      });
      setSuccess(true);
      // Volver al perfil tras 1.5 segundos
      setTimeout(() => router.back(), 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al cambiar la contraseña';
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
          <Animated.View style={[styles.header, headerStyle]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Cambiar contraseña</Text>
            <View style={styles.rule} />
            <Text style={styles.subtitle}>
              Ingresa tu contraseña actual y luego define la nueva.
            </Text>
          </Animated.View>

          {/* ── Formulario ── */}
          <View style={styles.card}>
            <Field
              label="Contraseña actual"
              value={oldPassword}
              onChangeText={setOldPassword}
              placeholder="Tu contraseña actual"
              delay={200}
            />

            <Field
              label="Nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 8 caracteres"
              delay={320}
            />
            <PasswordRules password={newPassword} />

            <Field
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite la nueva contraseña"
              delay={440}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.noMatchText}>Las contraseñas no coinciden</Text>
            )}
            {confirmPassword.length > 0 && passwordsMatch && (
              <Text style={styles.matchText}>Las contraseñas coinciden</Text>
            )}
          </View>

          {/* ── Feedback ── */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Contraseña actualizada correctamente.</Text>
            </View>
          )}

          {/* ── Botón ── */}
          <Animated.View style={[styles.btnWrap, btnStyle]}>
            <TouchableOpacity
              style={[styles.btnSave, !canSubmit && styles.btnDisabled]}
              activeOpacity={0.82}
              onPress={handleChange}
              disabled={!canSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#07101F" size="small" />
              ) : (
                <>
                  <Text style={styles.btnLabel}>Actualizar contraseña</Text>
                  <View style={styles.btnArrowWrap}>
                    <Text style={styles.btnArrow}>→</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
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
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: C.orb1, top: -80, right: -70,
  },
  orb2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: C.orb2, bottom: 200, left: -80,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 52,
  },

  // ── Header
  header: { marginBottom: 28 },
  backBtn: { marginBottom: 16 },
  backText: { fontSize: 14, color: C.accent, fontFamily: F?.demi },
  title: {
    fontSize: 28, fontWeight: '800', color: C.text,
    letterSpacing: -0.8, fontFamily: F?.heavy, marginBottom: 12,
  },
  rule: {
    width: 32, height: 2.5, backgroundColor: C.accent,
    borderRadius: 2, marginBottom: 12, opacity: 0.9,
  },
  subtitle: { fontSize: 13, color: C.muted, fontFamily: F?.regular, lineHeight: 20 },

  // ── Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18, marginBottom: 16, gap: 4,
  },

  // ── Fields
  fieldWrap: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12, fontWeight: '700', color: C.accent,
    letterSpacing: 1.4, fontFamily: F?.bold, marginBottom: 7, opacity: 0.9,
  },
  inputBox: {
    backgroundColor: C.inputBg, borderRadius: 13, borderWidth: 1,
    borderColor: C.inputBorder, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
  },
  inputBoxFocused: { borderColor: C.inputFocus },
  input: { fontSize: 14.5, color: C.text, fontFamily: F?.regular },

  // ── Password rules
  rulesBox: { paddingVertical: 4, gap: 5, marginBottom: 8 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: {
    fontSize: 14, width: 16, textAlign: 'center',
    color: 'rgba(237,244,255,0.25)', fontFamily: F?.bold,
  },
  ruleDotOk: { color: C.success },
  ruleText: { fontSize: 12.5, color: 'rgba(237,244,255,0.25)', fontFamily: F?.regular },
  ruleTextOk: { color: C.success },

  // ── Match hints
  noMatchText: { fontSize: 12, color: C.error, fontFamily: F?.regular, marginTop: -6, marginBottom: 4 },
  matchText: { fontSize: 12, color: C.success, fontFamily: F?.regular, marginTop: -6, marginBottom: 4 },

  // ── Feedback
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)', paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
  },
  errorText: { color: C.error, fontSize: 13, fontFamily: F?.regular, textAlign: 'center' },
  successBox: {
    backgroundColor: 'rgba(74,222,128,0.10)', borderRadius: 10, borderWidth: 1,
    borderColor: 'rgba(74,222,128,0.30)', paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
  },
  successText: { color: C.success, fontSize: 13, fontFamily: F?.regular, textAlign: 'center' },

  // ── Button
  btnWrap: {},
  btnSave: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.accent, borderRadius: 16,
    paddingVertical: 17, paddingHorizontal: 36, gap: 10,
    shadowColor: C.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 22, elevation: 10,
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: {
    fontSize: 16, fontWeight: '700', color: '#07101F',
    letterSpacing: -0.3, fontFamily: F?.bold,
  },
  btnArrowWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(7,16,31,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  btnArrow: { fontSize: 15, color: '#07101F', fontWeight: '800' },
});
