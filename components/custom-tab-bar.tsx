import { useAuthStore } from '@/stores/auth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Palette ──────────────────────────────────────────────────
const C = {
  tabBar: '#0D1B2E',
  accent: '#00E5CC',
  accentGlow: 'rgba(0,229,204,0.14)',
  bg: '#07101F',
  muted: 'rgba(237,244,255,0.32)',
};

// ── Layout ───────────────────────────────────────────────────
const H_PAD = 0; // Cambiado a 0 para que ocupe todo el ancho si deseas, o mantén 10 para flotante
const TAB_BAR_H = 70; // Un poco más alta para dar aire
const SCREEN_W = Dimensions.get('window').width;
const INNER_W = SCREEN_W - (H_PAD * 2);
const TAB_W = INNER_W / 5;

// La burbuja ahora es circular y más grande
const BUBBLE_SIZE = 58;
const BUBBLE_TOP = -18; // Esto hace que "salte" hacia afuera de la barra

// ── Tab config ───────────────────────────────────────────────
type MatIcon = React.ComponentProps<typeof MaterialIcons>['name'];

const TABS: { route: string; label: string; icon: MatIcon }[] = [
  { route: 'contratos', label: 'Contratos', icon: 'description' },
  { route: 'permisos', label: 'Permisos', icon: 'event-available' },
  { route: 'index', label: 'Inicio', icon: 'home' },
  { route: 'vacaciones', label: 'Vacaciones', icon: 'beach-access' },
  { route: 'profile', label: 'Perfil', icon: 'person' },
];

const PROTECTED = new Set(['contratos', 'permisos', 'vacaciones', 'profile']);

const getBubbleX = (idx: number) => {
  return (idx * TAB_W) + (TAB_W - BUBBLE_SIZE) / 2;
};

// ── Component ────────────────────────────────────────────────
export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { user } = useAuthStore();

  const insets = useSafeAreaInsets();
  const currentRoute = state.routes[state.index]?.name ?? 'index';
  const activeIdx = TABS.findIndex((t) => t.route === currentRoute);
  const displayIdx = activeIdx === -1 ? 2 : activeIdx;

  const bx = useSharedValue(getBubbleX(displayIdx));

  useEffect(() => {
    // Ajuste de spring para un movimiento firme y fluido
    bx.value = withSpring(getBubbleX(displayIdx), {
      damping: 25,
      stiffness: 200,
      mass: 0.5,
    });
  }, [displayIdx]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bx.value }],
  }));

  function handlePress(routeName: string) {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const target = PROTECTED.has(routeName) && !user ? 'login' : routeName;
    const route = state.routes.find((r) => r.name === target);
    if (!route) return;
    const isFocused = state.routes[state.index].name === target;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(target);
    }
  }

  return (
    <View style={styles.outer}>
      <View style={[
        styles.tabBar,
        {
          height: TAB_BAR_H + insets.bottom, // Sumamos el inset al alto total
          paddingBottom: insets.bottom       // Empujamos los iconos hacia arriba
        }
      ]}>
        {/* Burbuja animada */}
        <Animated.View pointerEvents="none" style={[styles.bubble, bubbleStyle]} />

        {TABS.map((tab, idx) => {
          const active = displayIdx === idx;
          return (
            <Pressable
              key={tab.route}
              style={styles.tab}
              onPress={() => handlePress(tab.route)}
            >
              {/* El wrap ahora solo envuelve al ícono para animarlo solo a él */}
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <MaterialIcons
                  name={tab.icon}
                  size={26}
                  color={active ? C.tabBar : C.muted}
                />
              </View>

              {/* El texto se queda fijo abajo, solo cambia color y peso */}
              <Text
                style={[
                  styles.label,
                  active && styles.labelActiveHighlight
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.tabBar,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    height: TAB_BAR_H,
    alignItems: 'center',
    justifyContent: 'space-around',
    // Sombras
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: C.accent, // Color sólido para que resalte como en tu ejemplo
    top: BUBBLE_TOP,
    left: 0,
    borderWidth: 6,
    borderColor: '#060d17', // Un borde del color del fondo de la app o barra para el efecto "cut-out"
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 8, 
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconWrapActive: {
    // Solo sube el ícono hacia la burbuja
    transform: [{ translateY: -22 }], 
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: C.muted,
    marginTop: 2, // Espacio entre el área del ícono y el texto
  },
  labelActiveHighlight: {
    // Estilo cuando está activo: fuera de la burbuja, color neón
    color: C.accent, 
    fontWeight: '800',
    fontSize: 10.5,
  },
});