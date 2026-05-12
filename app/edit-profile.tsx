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
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyProfile,
  updateMyProfile,
  getGenders,
  type PersonResponse,
  type PersonUpdate,
} from '@/services/persons';
import { ApiError } from '@/services/http';
import {
  getColombiaCities,
  getColombiaMunicipalities,
  isCountryStateCityConfigured,
  type LocationOption,
} from '@/services/locations';

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
  sheetBg: '#101B2E',
  sheetOverlay: 'rgba(4,10,20,0.78)',
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

// ── Helpers ───────────────────────────────────────────────
function getBirthDateText(date: Date | null): string {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

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

// ── Select field (touchable, opens a sheet) ───────────────
function SelectField({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  loading = false,
  helperText,
  delay = 0,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  helperText?: string;
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
      <TouchableOpacity
        style={[styles.inputBox, styles.selectBox, disabled && styles.selectBoxDisabled]}
        onPress={onPress}
        activeOpacity={0.82}
        disabled={disabled}
      >
        <Text style={[styles.input, !value && styles.selectPlaceholder]}>
          {value || placeholder}
        </Text>
        {loading ? (
          <ActivityIndicator color={C.accent} size="small" />
        ) : (
          <Text style={styles.selectArrow}>v</Text>
        )}
      </TouchableOpacity>
      {helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </Animated.View>
  );
}

// ── Selection sheet (Picker modal) ────────────────────────
function SelectionSheet({
  visible,
  title,
  selectedValue,
  options,
  placeholder,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  selectedValue: string;
  options: LocationOption[];
  placeholder: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(selectedValue);
  const isAndroid = Platform.OS === 'android';
  const pickerTextColor = isAndroid ? '#07101F' : C.text;
  const pickerPlaceholderColor = isAndroid ? 'rgba(7,16,31,0.55)' : C.muted;

  useEffect(() => {
    if (visible) {
      setDraftValue(selectedValue);
    }
  }, [selectedValue, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <View style={styles.sheetCard}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <View style={styles.sheetPickerWrap}>
            <Picker
              selectedValue={draftValue}
              onValueChange={(value) => setDraftValue(String(value))}
              dropdownIconColor={C.accent}
              style={[styles.sheetPicker, isAndroid && styles.sheetPickerAndroid]}
              itemStyle={styles.sheetPickerItem}
            >
              <Picker.Item label={placeholder} value="" color={pickerPlaceholderColor} />
              {options.map((option) => (
                <Picker.Item
                  key={`${title}-${option.value}`}
                  label={option.label}
                  value={option.value}
                  color={pickerTextColor}
                />
              ))}
            </Picker>
          </View>
          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.sheetBtnSecondary} onPress={onClose} activeOpacity={0.82}>
              <Text style={styles.sheetBtnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sheetBtnPrimary}
              onPress={() => {
                onConfirm(draftValue);
                onClose();
              }}
              activeOpacity={0.82}
            >
              <Text style={styles.sheetBtnPrimaryText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
type EditProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  gender: string;
  codeDepartment: string;
  codeCity: string;
  phone: string;
  address: string;
};

function normalizeOptionalText(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : null;
}

function buildProfileUpdatePayload(
  profile: PersonResponse | undefined,
  form: EditProfileForm
): PersonUpdate {
  const payload: PersonUpdate = {};

  const fields: {
    key: keyof PersonUpdate;
    next: string;
    current: string | null | undefined;
  }[] = [
    { key: 'first_name', next: form.firstName, current: profile?.first_name },
    { key: 'last_name', next: form.lastName, current: profile?.last_name },
    { key: 'email', next: form.email, current: profile?.email },
    { key: 'birth_date', next: form.birthDate, current: profile?.birth_date },
    { key: 'gender', next: form.gender, current: profile?.gender },
    { key: 'code_department', next: form.codeDepartment, current: profile?.code_department },
    { key: 'code_city', next: form.codeCity, current: profile?.code_city },
    { key: 'phone', next: form.phone, current: profile?.phone },
    { key: 'address', next: form.address, current: profile?.address },
  ];

  fields.forEach(({ key, next, current }) => {
    const normalizedNext = normalizeOptionalText(next);
    const normalizedCurrent = normalizeOptionalText(current);

    if (normalizedNext !== normalizedCurrent) {
      payload[key] = normalizedNext;
    }
  });

  return payload;
}

function getUpdateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 500) {
      return 'No fue posible guardar los cambios. El backend devolvio un error interno (500).';
    }
    if (error.status === 0 || error.status === undefined) {
      return 'No fue posible conectar con el servidor.';
    }
  }

  return error instanceof Error ? error.message : 'Error al actualizar los datos';
}

export default function EditProfileScreen() {
  const queryClient = useQueryClient();
  const hasCountryStateCityKey = isCountryStateCityConfigured();

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

  const {
    data: municipalityOptions = [],
    isLoading: loadingMunicipalities,
  } = useQuery({
    queryKey: ['colombiaMunicipalities'],
    queryFn: getColombiaMunicipalities,
    staleTime: Infinity,
    enabled: hasCountryStateCityKey,
  });

  // ── Form state ────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateValue, setBirthDateValue] = useState<Date | null>(null);
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [draftBirthDateValue, setDraftBirthDateValue] = useState(new Date());
  const [gender, setGender] = useState('');
  const [selectedMunicipalityIso2, setSelectedMunicipalityIso2] = useState('');
  const [selectedMunicipalityLabel, setSelectedMunicipalityLabel] = useState('');
  const [selectedCityLabel, setSelectedCityLabel] = useState('');
  const [showMunicipalitySheet, setShowMunicipalitySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Initialize from profile on first load
  useEffect(() => {
    if (profile && !initialized) {
      setFirstName(profile.first_name ?? '');
      setLastName(profile.last_name ?? '');
      setEmail(profile.email ?? '');
      const bd = profile.birth_date ?? '';
      setBirthDate(bd);
      if (bd) {
        const parsed = new Date(bd + 'T00:00:00');
        if (!isNaN(parsed.getTime())) {
          setBirthDateValue(parsed);
          setDraftBirthDateValue(parsed);
        }
      }
      setGender(profile.gender ?? '');
      setSelectedMunicipalityLabel(profile.code_department ?? '');
      setSelectedCityLabel(profile.code_city ?? '');
      setPhone(profile.phone ?? '');
      setAddress(profile.address ?? '');
      setInitialized(true);
    }
  }, [profile, initialized]);

  // Once municipalities load, find the ISO2 that matches the saved department label
  useEffect(() => {
    if (initialized && selectedMunicipalityLabel && municipalityOptions.length > 0 && !selectedMunicipalityIso2) {
      const match = municipalityOptions.find((opt) => opt.label === selectedMunicipalityLabel);
      if (match) {
        setSelectedMunicipalityIso2(match.value);
      }
    }
  }, [initialized, selectedMunicipalityLabel, municipalityOptions, selectedMunicipalityIso2]);

  const {
    data: cityOptions = [],
    isLoading: loadingCities,
  } = useQuery({
    queryKey: ['colombiaCities', selectedMunicipalityIso2],
    queryFn: () => getColombiaCities(selectedMunicipalityIso2),
    staleTime: Infinity,
    enabled: hasCountryStateCityKey && selectedMunicipalityIso2.length > 0,
  });

  // ── UI state ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // ── Date picker handlers ──────────────────────────────────
  const handleBirthDatePress = () => {
    const currentValue = birthDateValue ?? new Date('2000-01-01T00:00:00');
    if (Platform.OS === 'ios') {
      setDraftBirthDateValue(currentValue);
      setShowIosDatePicker(true);
      return;
    }
    setShowAndroidDatePicker(true);
  };

  const handleAndroidBirthDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowAndroidDatePicker(false);
    if (event.type !== 'set' || !selectedDate) return;
    setBirthDateValue(selectedDate);
    setBirthDate(getBirthDateText(selectedDate));
  };

  // ── Save handler ──────────────────────────────────────────
  const handleSave = async () => {
    if (loading) return;
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const payload = buildProfileUpdatePayload(profile, {
        firstName,
        lastName,
        email,
        birthDate,
        gender,
        codeDepartment: selectedMunicipalityLabel,
        codeCity: selectedCityLabel,
        phone,
        address,
      });
      const changedFields = Object.keys(payload);

      if (changedFields.length === 0) {
        setSuccessMessage('No habia cambios para guardar.');
        setTimeout(() => router.back(), 800);
        return;
      }

      console.log('[EditProfile] Updating profile', { changedFields });

      const updated = await updateMyProfile(payload);
      queryClient.setQueryData(['myProfile'], updated);
      setSuccessMessage('Perfil actualizado correctamente.');
      setTimeout(() => router.back(), 1200);
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        console.warn('[EditProfile] updateMyProfile failed', {
          status: e.status,
          method: e.method,
          url: e.url,
          data: e.data,
        });
      }
      const msg = getUpdateErrorMessage(e);
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
            <SelectField
              label="Fecha de nacimiento"
              value={birthDate}
              placeholder="YYYY-MM-DD"
              onPress={handleBirthDatePress}
              delay={380}
            />
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
            <SelectField
              label="Municipio / Departamento"
              value={selectedMunicipalityLabel}
              placeholder="Selecciona un municipio"
              onPress={() => setShowMunicipalitySheet(true)}
              disabled={!hasCountryStateCityKey || municipalityOptions.length === 0}
              loading={loadingMunicipalities}
              helperText={
                !hasCountryStateCityKey
                  ? 'Configura EXPO_PUBLIC_CSC_API_KEY para habilitar esta opción'
                  : undefined
              }
              delay={550}
            />
            <SelectField
              label="Ciudad"
              value={selectedCityLabel}
              placeholder={
                selectedMunicipalityIso2
                  ? 'Selecciona una ciudad'
                  : 'Selecciona primero un municipio'
              }
              onPress={() => setShowCitySheet(true)}
              disabled={
                !hasCountryStateCityKey ||
                !selectedMunicipalityIso2 ||
                cityOptions.length === 0
              }
              loading={loadingCities}
              delay={610}
            />
            <Field label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" delay={670} />
            <Field label="Dirección" value={address} onChangeText={setAddress} delay={730} />
          </View>

          {/* ── Feedback ── */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {successMessage && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
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

      {/* ── Android date picker ── */}
      {showAndroidDatePicker && (
        <DateTimePicker
          value={birthDateValue ?? new Date('2000-01-01T00:00:00')}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleAndroidBirthDateChange}
        />
      )}

      {/* ── iOS date picker modal ── */}
      <Modal
        visible={showIosDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIosDatePicker(false)}
      >
        <View style={styles.sheetOverlay}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>Selecciona la fecha de nacimiento</Text>
            <DateTimePicker
              value={draftBirthDateValue}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setDraftBirthDateValue(selectedDate);
                }
              }}
              style={styles.iosDatePicker}
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.sheetBtnSecondary}
                onPress={() => setShowIosDatePicker(false)}
                activeOpacity={0.82}
              >
                <Text style={styles.sheetBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetBtnPrimary}
                onPress={() => {
                  setBirthDateValue(draftBirthDateValue);
                  setBirthDate(getBirthDateText(draftBirthDateValue));
                  setShowIosDatePicker(false);
                }}
                activeOpacity={0.82}
              >
                <Text style={styles.sheetBtnPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Municipality sheet ── */}
      <SelectionSheet
        visible={showMunicipalitySheet}
        title="Selecciona un municipio"
        selectedValue={selectedMunicipalityIso2}
        options={municipalityOptions}
        placeholder="Selecciona un municipio"
        onClose={() => setShowMunicipalitySheet(false)}
        onConfirm={(value) => {
          const selected = municipalityOptions.find((opt) => opt.value === value);
          setSelectedMunicipalityIso2(value);
          setSelectedMunicipalityLabel(selected?.label ?? '');
          setSelectedCityLabel(''); // reset city when municipality changes
        }}
      />

      {/* ── City sheet ── */}
      <SelectionSheet
        visible={showCitySheet}
        title="Selecciona una ciudad"
        selectedValue={selectedCityLabel}
        options={cityOptions}
        placeholder="Selecciona una ciudad"
        onClose={() => setShowCitySheet(false)}
        onConfirm={(value) => {
          const selected = cityOptions.find((opt) => opt.value === value);
          setSelectedCityLabel(selected?.label ?? '');
        }}
      />
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

  // ── Select field
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBoxDisabled: { opacity: 0.55 },
  selectPlaceholder: { color: C.muted },
  selectArrow: {
    color: C.accent,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: F?.bold,
    marginLeft: 12,
  },
  helperText: {
    marginTop: 6,
    color: C.muted,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: F?.regular,
  },

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

  // ── Sheet (date picker + location selectors)
  sheetOverlay: {
    flex: 1,
    backgroundColor: C.sheetOverlay,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  sheetCard: {
    backgroundColor: C.sheetBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.accentBorder,
    padding: 20,
  },
  sheetTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: F?.bold,
    marginBottom: 14,
    textAlign: 'center',
  },
  sheetPickerWrap: {
    backgroundColor: C.inputBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.inputBorder,
    overflow: 'hidden',
  },
  sheetPicker: {
    color: C.text,
    minHeight: 180,
  },
  sheetPickerAndroid: {
    color: '#07101F',
    backgroundColor: '#FFFFFF',
  },
  sheetPickerItem: {
    color: C.text,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  sheetBtnSecondary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  sheetBtnSecondaryText: {
    color: C.text,
    fontSize: 14,
    fontFamily: F?.demi,
  },
  sheetBtnPrimary: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: C.accent,
  },
  sheetBtnPrimaryText: {
    color: '#07101F',
    fontSize: 14,
    fontFamily: F?.bold,
  },
  iosDatePicker: {
    alignSelf: 'center',
  },
});
