import React, { useEffect, useMemo, useState } from 'react';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyProfile, updateMyProfile, getGenders } from '@/services/persons';

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
  keyboardType = 'default',
  delay = 0,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
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
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </Animated.View>
  );
}

// ── Pill selector ─────────────────────────────────────────
function PillSelector({
  label,
  options,
  value,
  onChange,
  delay = 0,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  delay?: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 90 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.fieldWrap, animStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pill, value === opt.value && styles.pillActive]}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.pillText, value === opt.value && styles.pillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Section header ────────────────────────────────────────
function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
  }, []);

  return (
    <Animated.View style={[styles.sectionHeader, useAnimatedStyle(() => ({ opacity: opacity.value }))]}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </Animated.View>
  );
}

// ── Edit Profile Screen ───────────────────────────────────
export default function EditProfileScreen() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
    staleTime: 1000 * 60 * 5,
  });

  const { data: gendersRaw } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
    staleTime: Infinity,
  });

  const genderOptions = useMemo(
    () => (gendersRaw ?? ['Masculino', 'Femenino', 'Otro']).map((v) => ({ value: v, label: v })),
    [gendersRaw]
  );

  // Campos del formulario — se inicializan cuando llega el perfil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [codeDepartment, setCodeDepartment] = useState('');
  const [codeCity, setCodeCity] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setEmail(profile.email ?? '');
      setBirthDate(profile.birth_date ?? '');
      setGender(profile.gender ?? '');
      setCodeDepartment(profile.code_department ?? '');
      setCodeCity(profile.code_city ?? '');
      setPhone(profile.phone ?? '');
      setAddress(profile.address ?? '');
      setInitialized(true);
    }
  }, [profile]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const handleSave = async () => {
    if (loading) return;
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const emailChanged = email.trim() !== (profile?.email ?? '');

      const updated = await updateMyProfile({
        ...(firstName && { first_name: firstName.trim() }),
        ...(lastName && { last_name: lastName.trim() }),
        // Solo enviar email si el usuario lo modificó para evitar error 500 por unicidad
        ...(emailChanged && email.trim() && { email: email.trim() }),
        ...(birthDate && { birth_date: birthDate.trim() }),
        ...(gender && { gender }),
        ...(codeDepartment && { code_department: codeDepartment.trim() }),
        ...(codeCity && { code_city: codeCity.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(address && { address: address.trim() }),
      });
      // Actualizar la cache de React Query con los datos nuevos
      queryClient.setQueryData(['myProfile'], updated);
      setSuccess(true);
      setTimeout(() => router.back(), 1200);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al actualizar los datos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile && !initialized) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

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
            <Text style={styles.title}>Editar perfil</Text>
            <View style={styles.rule} />
            <Text style={styles.subtitle}>Todos los campos son opcionales.</Text>
          </Animated.View>

          {/* ── Datos personales ── */}
          <SectionHeader title="DATOS PERSONALES" delay={150} />
          <View style={styles.card}>
            <Field label="Nombre(s)" value={firstName} onChangeText={setFirstName} delay={200} />
            <Field label="Apellido(s)" value={lastName} onChangeText={setLastName} delay={260} />
            <Field label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" delay={320} />
            <Field label="Fecha de nacimiento" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" delay={380} />
            <PillSelector
              label="Género"
              options={genderOptions}
              value={gender}
              onChange={setGender}
              delay={440}
            />
          </View>

          {/* ── Ubicación y contacto ── */}
          <SectionHeader title="UBICACIÓN Y CONTACTO" delay={500} />
          <View style={styles.card}>
            <Field label="Código de departamento" value={codeDepartment} onChangeText={setCodeDepartment} keyboardType="numeric" delay={550} />
            <Field label="Código de ciudad" value={codeCity} onChangeText={setCodeCity} keyboardType="numeric" delay={610} />
            <Field label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" delay={670} />
            <Field label="Dirección" value={address} onChangeText={setAddress} delay={730} />
          </View>

          {/* ── Feedback ── */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>Perfil actualizado correctamente.</Text>
            </View>
          )}

          {/* ── Botón guardar ── */}
          <Animated.View style={[styles.btnWrap, btnStyle]}>
            <TouchableOpacity
              style={[styles.btnSave, loading && styles.btnDisabled]}
              activeOpacity={0.82}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#07101F" size="small" />
              ) : (
                <>
                  <Text style={styles.btnLabel}>Guardar cambios</Text>
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
  centered: { alignItems: 'center', justifyContent: 'center' },
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
  subtitle: {
    fontSize: 13, color: C.muted, fontFamily: F?.regular, lineHeight: 20,
  },

  // ── Section
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, marginTop: 4, gap: 10,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: {
    fontSize: 10.5, fontWeight: '700', color: C.accent,
    letterSpacing: 2, fontFamily: F?.bold, opacity: 0.7,
  },

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

  // ── Pills
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 7, paddingHorizontal: 16, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: { backgroundColor: C.accentGlow, borderColor: C.accentBorder },
  pillText: { fontSize: 13, color: C.muted, fontFamily: F?.regular },
  pillTextActive: { color: C.accent, fontFamily: F?.demi },

  // ── Feedback
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.35)',
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
  },
  errorText: { color: C.error, fontSize: 13, fontFamily: F?.regular, textAlign: 'center' },
  successBox: {
    backgroundColor: 'rgba(74,222,128,0.10)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(74,222,128,0.30)',
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12,
  },
  successText: { color: C.success, fontSize: 13, fontFamily: F?.regular, textAlign: 'center' },

  // ── Button
  btnWrap: { marginTop: 4 },
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
