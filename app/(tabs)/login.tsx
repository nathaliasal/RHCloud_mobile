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
  Dimensions,
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

const { width } = Dimensions.get('window');

// ── Palette (misma que index.tsx) ─────────────────────────
const C = {
  bg: '#07101F',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.15)',
  accentBorder: 'rgba(0,229,204,0.35)',
  accentShadow: 'rgba(0,229,204,0.45)',
  text: '#EDF4FF',
  muted: 'rgba(237,244,255,0.50)',
  mutedLight: 'rgba(237,244,255,0.12)',
  orb1: 'rgba(0,180,216,0.16)',
  orb2: 'rgba(100,30,200,0.13)',
  inputBg: 'rgba(255,255,255,0.055)',
  inputBorder: 'rgba(255,255,255,0.09)',
  inputFocus: 'rgba(0,229,204,0.35)',
  error: '#FF6B6B',
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

// ── Animated Input ────────────────────────────────────────
function AnimatedInput({
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
  const translateY = useSharedValue(20);
  const borderOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 22, stiffness: 90 }));
  }, []);

  useEffect(() => {
    borderOpacity.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused]);

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: focused ? C.inputFocus : C.inputBorder,
  }));

  return (
    <Animated.View style={[styles.fieldWrap, wrapStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Animated.View style={[styles.inputBox, borderStyle]}>
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
      </Animated.View>
    </Animated.View>
  );
}

// ── Login Screen ──────────────────────────────────────────
export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(-18);
  const logoScale = useSharedValue(0.75);
  const ringScale = useSharedValue(1);
  const btnProgress = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    heroY.value = withSpring(0, { damping: 22, stiffness: 85 });
    logoScale.value = withDelay(120, withSpring(1, { damping: 14, stiffness: 110 }));
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    btnProgress.value = withDelay(900, withTiming(1, { duration: 600 }));
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

  const btnStyle = useAnimatedStyle(() => ({
    opacity: btnProgress.value,
    transform: [{ translateY: interpolate(btnProgress.value, [0, 1], [16, 0]) }],
  }));

  const handleLogin = () => {
    // Aquí irá la lógica de autenticación
  };

  return (
    <View style={styles.root}>
      {/* Orbs decorativos */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />
      <View style={styles.orb3} />

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
          {/* ── Hero ── */}
          <Animated.View style={[styles.hero, heroStyle]}>
            <Animated.View style={[styles.logoPulseRing, ringStyle]} />
            <Animated.View style={[styles.logoMark, logoStyle]}>
              <Text style={styles.logoText}>RH</Text>
              <View style={styles.logoDot} />
            </Animated.View>
            <Text style={styles.appName}>RHCloud</Text>
            <Text style={styles.tagline}>Bienvenido de vuelta</Text>
            <View style={styles.rule} />
            <Text style={styles.subtitle}>
              Inicia sesión para gestionar tu vida laboral
            </Text>
          </Animated.View>

          {/* ── Formulario ── */}
          <View style={styles.formCard}>
            <AnimatedInput
              label="Usuario"
              value={usuario}
              onChangeText={setUsuario}
              placeholder="Ingresa tu usuario"
              delay={350}
            />

            <AnimatedInput
              label="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="Ingresa tu contraseña"
              secureTextEntry
              delay={500}
            />

            {/* ── Botón Entrar ── */}
            <Animated.View style={[styles.btnWrap, btnStyle]}>
              <TouchableOpacity
                style={[
                  styles.btnEntrar,
                  (!usuario || !contrasena) && styles.btnDisabled,
                ]}
                activeOpacity={0.82}
                onPress={handleLogin}
                disabled={!usuario || !contrasena}
              >
                <Text style={styles.btnLabel}>Entrar</Text>
                <View style={styles.btnArrowWrap}>
                  <Text style={styles.btnArrow}>→</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  kav: { flex: 1 },
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 72 : 52,
    paddingBottom: 48,
  },

  // ── Hero
  hero: {
    alignItems: 'center',
    marginBottom: 44,
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
    marginBottom: 10,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
    letterSpacing: -0.3,
    fontFamily: F?.demi,
    marginBottom: 16,
  },
  rule: {
    width: 36,
    height: 2.5,
    backgroundColor: C.accent,
    borderRadius: 2,
    marginBottom: 16,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 14,
    color: C.muted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.72,
    fontFamily: F?.regular,
  },

  // ── Form card
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    gap: 6,
  },

  // ── Fields
  fieldWrap: {
    marginBottom: 14,
  },
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

  // ── Button
  btnWrap: {
    marginTop: 10,
  },
  btnEntrar: {
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
  btnDisabled: {
    opacity: 0.45,
  },
  btnLabel: {
    fontSize: 17,
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
  btnArrow: {
    fontSize: 15,
    color: '#07101F',
    fontWeight: '800',
  },
});
