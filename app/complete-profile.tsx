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
  Dimensions,
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
import { useQuery } from '@tanstack/react-query';
import { createPerson, getDocumentTypes, getGenders, DocumentType } from '@/services/persons';
import { verifyUser } from '@/services/users';
import { useAuthStore } from '@/stores/auth';
import { getMe } from '@/services/auth';

const { width } = Dimensions.get('window');

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
  orb1: 'rgba(0,180,216,0.16)',
  orb2: 'rgba(100,30,200,0.13)',
  sectionBorder: 'rgba(255,255,255,0.06)',
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

// ── Field component ───────────────────────────────────────
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  required = false,
  delay = 0,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  required?: boolean;
  delay?: number;
}) {
  const [focused, setFocused] = useState(false);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 90 }));
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.fieldWrap, wrapStyle]}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.muted}
          secureTextEntry={secureTextEntry}
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
function PillSelector<T extends string>({
  label,
  options,
  value,
  onChange,
  delay = 0,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | '';
  onChange: (v: T) => void;
  delay?: number;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(14);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 90 }));
  }, []);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.fieldWrap, wrapStyle]}>
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
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </Animated.View>
  );
}

// ── Complete Profile Screen ───────────────────────────────
export default function CompleteProfileScreen() {
  const { setUser } = useAuthStore();

  // Tipos de documento desde el servidor
  const { data: docTypesRaw } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: getDocumentTypes,
    staleTime: Infinity, // no cambian frecuentemente
  });

  const docTypeOptions = useMemo(
    () => (docTypesRaw ?? ['CC', 'CE', 'NIT']).map((v) => ({ value: v, label: v })),
    [docTypesRaw]
  );

  const { data: gendersRaw } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
    staleTime: Infinity,
  });

  const genderOptions = useMemo(
    () => (gendersRaw ?? ['Masculino', 'Femenino', 'Otro']).map((v) => ({ value: v, label: v })),
    [gendersRaw]
  );

  // Campos obligatorios
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Documento
  const [documentType, setDocumentType] = useState<DocumentType | ''>('CC');
  const [documentNumber, setDocumentNumber] = useState('');

  // Datos personales
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<string>('');

  // Ubicacion y contacto
  const [codeDepartment, setCodeDepartment] = useState('');
  const [codeCity, setCodeCity] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  // Animacion del header
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-16);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerY.value = withSpring(0, { damping: 22, stiffness: 85 });
    btnOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      await createPerson({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ...(documentType && { document_type: documentType }),
        ...(documentNumber && { document_number: documentNumber.trim() }),
        ...(birthDate && { birth_date: birthDate.trim() }),
        ...(gender && { gender }),
        ...(codeDepartment && { code_department: codeDepartment.trim() }),
        ...(codeCity && { code_city: codeCity.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(address && { address: address.trim() }),
      });

      // Marcar usuario como verificado tras completar los datos personales
      await verifyUser();

      // Refrescar el perfil para obtener is_verified actualizado
      const profile = await getMe();
      setUser(profile);
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al guardar los datos';
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
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>RH</Text>
              <View style={styles.logoDot} />
            </View>
            <Text style={styles.title}>Completa tu perfil</Text>
            <View style={styles.rule} />
            <Text style={styles.subtitle}>
              Necesitamos algunos datos para activar tu cuenta.{'\n'}
              Solo tu nombre es obligatorio.
            </Text>
          </Animated.View>

          {/* ── Datos básicos ── */}
          <SectionHeader title="DATOS BÁSICOS" delay={150} />
          <View style={styles.card}>
            <Field
              label="Nombre(s)"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ej: Juan Carlos"
              required
              delay={200}
            />
            <Field
              label="Apellido(s)"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ej: García López"
              required
              delay={270}
            />
          </View>

          {/* ── Documento ── */}
          <SectionHeader title="DOCUMENTO" delay={330} />
          <View style={styles.card}>
            <PillSelector<DocumentType>
              label="Tipo de documento"
              options={docTypeOptions}
              value={documentType}
              onChange={setDocumentType}
              delay={380}
            />
            <Field
              label="Número de documento"
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="Ej: 1234567890"
              keyboardType="numeric"
              delay={440}
            />
          </View>

          {/* ── Información personal ── */}
          <SectionHeader title="INFORMACIÓN PERSONAL" delay={500} />
          <View style={styles.card}>
            <Field
              label="Fecha de nacimiento"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              delay={550}
            />
            <PillSelector<string>
              label="Género"
              options={genderOptions}
              value={gender}
              onChange={setGender}
              delay={610}
            />
          </View>

          {/* ── Ubicación y contacto ── */}
          <SectionHeader title="UBICACIÓN Y CONTACTO" delay={670} />
          <View style={styles.card}>
            <Field
              label="Código de departamento"
              value={codeDepartment}
              onChangeText={setCodeDepartment}
              placeholder="Ej: 11"
              keyboardType="numeric"
              delay={720}
            />
            <Field
              label="Código de ciudad"
              value={codeCity}
              onChangeText={setCodeCity}
              placeholder="Ej: 11001"
              keyboardType="numeric"
              delay={780}
            />
            <Field
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej: 3001234567"
              keyboardType="phone-pad"
              delay={840}
            />
            <Field
              label="Dirección"
              value={address}
              onChangeText={setAddress}
              placeholder="Ej: Calle 123 # 45-67"
              delay={900}
            />
          </View>

          {/* ── Error ── */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Botón guardar ── */}
          <Animated.View style={[styles.btnWrap, btnStyle]}>
            <TouchableOpacity
              style={[styles.btnGuardar, (!canSubmit || loading) && styles.btnDisabled]}
              activeOpacity={0.82}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
            >
              {loading ? (
                <ActivityIndicator color="#07101F" size="small" />
              ) : (
                <>
                  <Text style={styles.btnLabel}>Guardar y continuar</Text>
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
    bottom: 200,
    left: -80,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 52,
  },

  // ── Header
  header: { alignItems: 'center', marginBottom: 32 },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: C.accentGlow,
    borderWidth: 1.2,
    borderColor: C.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  logoText: {
    fontSize: 24,
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
    bottom: 9,
    right: 9,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.8,
    fontFamily: F?.heavy,
    marginBottom: 12,
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
    maxWidth: width * 0.75,
    fontFamily: F?.regular,
  },

  // ── Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
    gap: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.sectionBorder,
  },
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    marginBottom: 16,
    gap: 4,
  },

  // ── Fields
  fieldWrap: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.accent,
    letterSpacing: 1.4,
    fontFamily: F?.bold,
    marginBottom: 7,
    opacity: 0.9,
  },
  required: { color: C.error },
  inputBox: {
    backgroundColor: C.inputBg,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 11,
  },
  inputBoxFocused: { borderColor: C.inputFocus },
  input: {
    fontSize: 14.5,
    color: C.text,
    fontFamily: F?.regular,
  },

  // ── Pill selector
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pillActive: {
    backgroundColor: C.accentGlow,
    borderColor: C.accentBorder,
  },
  pillText: {
    fontSize: 13,
    color: C.muted,
    fontFamily: F?.regular,
  },
  pillTextActive: {
    color: C.accent,
    fontFamily: F?.demi,
  },

  // ── Error
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  errorText: {
    color: C.error,
    fontSize: 13,
    fontFamily: F?.regular,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Button
  btnWrap: { marginTop: 4 },
  btnGuardar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 17,
    paddingHorizontal: 36,
    gap: 10,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 10,
  },
  btnDisabled: { opacity: 0.45 },
  btnLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#07101F',
    letterSpacing: -0.3,
    fontFamily: F?.bold,
  },
  btnArrowWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(7,16,31,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnArrow: { fontSize: 15, color: '#07101F', fontWeight: '800' },
});
