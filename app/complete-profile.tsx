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
import { useQuery } from '@tanstack/react-query';
import { createPerson, getDocumentTypes, getGenders, type DocumentType } from '@/services/persons';
import { verifyUser } from '@/services/users';
import { useAuthStore } from '@/stores/auth';
import { getMe } from '@/services/auth';
import {
  getColombiaCities,
  getColombiaMunicipalities,
  isCountryStateCityConfigured,
  type LocationOption,
} from '@/services/locations';

const { width } = Dimensions.get('window');

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
  onChangeText: (value: string) => void;
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
  onChange: (value: T) => void;
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
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.pill, value === option.value && styles.pillActive]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.75}>
            <Text style={[styles.pillText, value === option.value && styles.pillTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
}

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

function SelectField({
  label,
  value,
  placeholder,
  onPress,
  required = false,
  disabled = false,
  loading = false,
  helperText,
  delay = 0,
}: {
  label: string;
  value: string;
  placeholder: string;
  onPress: () => void;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helperText?: string;
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
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity
        style={[
          styles.inputBox,
          styles.selectBox,
          disabled && styles.selectBoxDisabled,
        ]}
        onPress={onPress}
        activeOpacity={0.82}
        disabled={disabled}>
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
              itemStyle={styles.sheetPickerItem}>
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
              activeOpacity={0.82}>
              <Text style={styles.sheetBtnPrimaryText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getBirthDateText(date: Date | null): string {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

export default function CompleteProfileScreen() {
  const { setUser } = useAuthStore();
  const hasCountryStateCityKey = isCountryStateCityConfigured();

  const { data: docTypesRaw } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: getDocumentTypes,
    staleTime: Infinity,
  });

  const docTypeOptions = useMemo(
    () => (docTypesRaw ?? ['CC', 'CE', 'NIT']).map((value) => ({ value, label: value })),
    [docTypesRaw]
  );

  const { data: gendersRaw } = useQuery({
    queryKey: ['genders'],
    queryFn: getGenders,
    staleTime: Infinity,
  });

  const genderOptions = useMemo(
    () => (gendersRaw ?? ['Masculino', 'Femenino', 'Otro']).map((value) => ({ value, label: value })),
    [gendersRaw]
  );

  const {
    data: municipalityOptions = [],
    isLoading: loadingMunicipalities,
    error: municipalitiesError,
  } = useQuery({
    queryKey: ['colombiaMunicipalities'],
    queryFn: getColombiaMunicipalities,
    staleTime: Infinity,
    enabled: hasCountryStateCityKey,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType | ''>('CC');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthDateValue, setBirthDateValue] = useState<Date | null>(null);
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [showIosDatePicker, setShowIosDatePicker] = useState(false);
  const [draftBirthDateValue, setDraftBirthDateValue] = useState(new Date());
  const [gender, setGender] = useState<string>('');
  const [selectedMunicipalityIso2, setSelectedMunicipalityIso2] = useState('');
  const [selectedMunicipalityLabel, setSelectedMunicipalityLabel] = useState('');
  const [selectedCityLabel, setSelectedCityLabel] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [showMunicipalitySheet, setShowMunicipalitySheet] = useState(false);
  const [showCitySheet, setShowCitySheet] = useState(false);

  const {
    data: cityOptions = [],
    isLoading: loadingCities,
    error: citiesError,
  } = useQuery({
    queryKey: ['colombiaCities', selectedMunicipalityIso2],
    queryFn: () => getColombiaCities(selectedMunicipalityIso2),
    staleTime: Infinity,
    enabled: hasCountryStateCityKey && selectedMunicipalityIso2.length > 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-16);
  const btnOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    headerY.value = withSpring(0, { damping: 22, stiffness: 85 });
    btnOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));
  }, []);

  useEffect(() => {
    setSelectedCityLabel('');
  }, [selectedMunicipalityIso2]);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));

  const municipalityErrorText =
    municipalitiesError instanceof Error ? municipalitiesError.message : null;
  const cityErrorText = citiesError instanceof Error ? citiesError.message : null;

  const locationHelperText = useMemo(() => {
    if (!hasCountryStateCityKey) {
      return 'Configura EXPO_PUBLIC_CSC_API_KEY para habilitar municipios y ciudades';
    }
    if (municipalityErrorText) return municipalityErrorText;
    if (selectedMunicipalityIso2 && cityErrorText) return cityErrorText;
    return undefined;
  }, [cityErrorText, hasCountryStateCityKey, municipalityErrorText, selectedMunicipalityIso2]);

  const handleBirthDatePress = () => {
    const currentValue = birthDateValue ?? new Date('2000-01-01T00:00:00');

    if (Platform.OS === 'ios') {
      setDraftBirthDateValue(currentValue);
      setShowIosDatePicker(true);
      return;
    }

    setShowAndroidDatePicker(true);
  };

  const handleAndroidBirthDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date
  ) => {
    setShowAndroidDatePicker(false);

    if (event.type !== 'set' || !selectedDate) return;

    setBirthDateValue(selectedDate);
    setBirthDate(getBirthDateText(selectedDate));
  };

  const handleSubmit = async () => {
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        ...(documentType && { document_type: documentType }),
        ...(documentNumber && { document_number: documentNumber.trim() }),
        ...(birthDate && { birth_date: birthDate }),
        ...(gender && { gender }),
        ...(selectedMunicipalityLabel && { code_department: selectedMunicipalityLabel }),
        ...(selectedCityLabel && { code_city: selectedCityLabel }),
        ...(phone && { phone: phone.trim() }),
        ...(address && { address: address.trim() }),
      };

      console.log('[CompleteProfile] createPerson payload', payload);

      await createPerson(payload);
      await verifyUser();

      const profile = await getMe();
      setUser(profile);
      router.replace('/');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error al guardar los datos';
      setError(message);
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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

          <SectionHeader title="DATOS BASICOS" delay={150} />
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
              placeholder="Ej: Garcia Lopez"
              required
              delay={270}
            />
          </View>

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
              label="Numero de documento"
              value={documentNumber}
              onChangeText={setDocumentNumber}
              placeholder="Ej: 1234567890"
              keyboardType="numeric"
              delay={440}
            />
          </View>

          <SectionHeader title="INFORMACION PERSONAL" delay={500} />
          <View style={styles.card}>
            <SelectField
              label="Fecha de nacimiento"
              value={birthDate}
              placeholder="YYYY-MM-DD"
              onPress={handleBirthDatePress}
              delay={550}
            />
            <PillSelector<string>
              label="Genero"
              options={genderOptions}
              value={gender}
              onChange={setGender}
              delay={610}
            />
          </View>

          <SectionHeader title="UBICACION Y CONTACTO" delay={670} />
          <View style={styles.card}>
            <SelectField
              label="Seleccione municipio"
              value={selectedMunicipalityLabel}
              placeholder="Selecciona un municipio"
              onPress={() => setShowMunicipalitySheet(true)}
              disabled={!hasCountryStateCityKey || municipalityOptions.length === 0}
              loading={loadingMunicipalities}
              helperText={locationHelperText}
              delay={720}
            />
            <SelectField
              label="Seleccione ciudad"
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
              delay={780}
            />
            <Field
              label="Telefono"
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej: 3001234567"
              keyboardType="phone-pad"
              delay={840}
            />
            <Field
              label="Direccion"
              value={address}
              onChangeText={setAddress}
              placeholder="Ej: Calle 123 # 45-67"
              delay={900}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Animated.View style={[styles.btnWrap, btnStyle]}>
            <TouchableOpacity
              style={[styles.btnGuardar, (!canSubmit || loading) && styles.btnDisabled]}
              activeOpacity={0.82}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}>
              {loading ? (
                <ActivityIndicator color="#07101F" size="small" />
              ) : (
                <>
                  <Text style={styles.btnLabel}>Guardar y continuar</Text>
                  <View style={styles.btnArrowWrap}>
                    <Text style={styles.btnArrow}>{'>'}</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showAndroidDatePicker && (
        <DateTimePicker
          value={birthDateValue ?? new Date('2000-01-01T00:00:00')}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleAndroidBirthDateChange}
        />
      )}

      <Modal
        visible={showIosDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIosDatePicker(false)}>
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
                activeOpacity={0.82}>
                <Text style={styles.sheetBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetBtnPrimary}
                onPress={() => {
                  setBirthDateValue(draftBirthDateValue);
                  setBirthDate(getBirthDateText(draftBirthDateValue));
                  setShowIosDatePicker(false);
                }}
                activeOpacity={0.82}>
                <Text style={styles.sheetBtnPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <SelectionSheet
        visible={showMunicipalitySheet}
        title="Selecciona un municipio"
        selectedValue={selectedMunicipalityIso2}
        options={municipalityOptions}
        placeholder="Selecciona un municipio"
        onClose={() => setShowMunicipalitySheet(false)}
        onConfirm={(value) => {
          const selectedOption = municipalityOptions.find((option) => option.value === value);
          setSelectedMunicipalityIso2(value);
          setSelectedMunicipalityLabel(selectedOption?.label ?? '');
        }}
      />

      <SelectionSheet
        visible={showCitySheet}
        title="Selecciona una ciudad"
        selectedValue={selectedCityLabel}
        options={cityOptions}
        placeholder="Selecciona una ciudad"
        onClose={() => setShowCitySheet(false)}
        onConfirm={(value) => {
          const selectedOption = cityOptions.find((option) => option.value === value);
          setSelectedCityLabel(selectedOption?.label ?? '');
        }}
      />
    </View>
  );
}

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
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    marginBottom: 16,
    gap: 4,
  },
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
  helperText: {
    marginTop: 6,
    color: C.muted,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: F?.regular,
  },
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
