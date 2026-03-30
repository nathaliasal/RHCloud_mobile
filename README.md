# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).


## Estructura del proyecto


```plaintext
RHCloud_mobile/
│
├── app/                              # Pantallas y navegación (Expo Router)
│   ├── _layout.tsx                   # Root layout — Stack + QueryClientProvider
│   ├── reset-password.tsx            # Pantalla de restablecimiento de contraseña
│   └── (tabs)/
│       ├── _layout.tsx               # Tab navigator (Inicio, Ingresar)
│       ├── index.tsx                 # Pantalla de bienvenida / features
│       └── login.tsx                 # Pantalla de inicio de sesión
│
├── services/                         # Capa de comunicación con el API
│   ├── auth.ts                       # Login, refresh, recuperar/resetear contraseña, getMe
│   └── http.ts                       # Cliente Axios con interceptores (Bearer token + auto-refresh)
│
├── stores/                           # Estado global (Zustand)
│   └── auth.ts                       # Store del usuario autenticado (persiste en AsyncStorage)
│
├── constants/                        # Valores globales
│   ├── api.ts                        # URL base y endpoints del API
│   └── theme.ts                      # Paleta de colores y fuentes
│
├── components/                       # Componentes reutilizables
│   ├── haptic-tab.tsx                # Tab con feedback háptico
│   ├── themed-text.tsx               # Texto adaptado al tema
│   ├── themed-view.tsx               # Vista adaptada al tema
│   ├── parallax-scroll-view.tsx      # Scroll con efecto parallax
│   └── ui/
│       ├── icon-symbol.tsx           # Íconos Material (Android / Web)
│       ├── icon-symbol.ios.tsx       # Íconos SF Symbols (iOS)
│       └── collapsible.tsx           # Sección expandible/colapsable
│
├── hooks/                            # Custom hooks
│   ├── use-color-scheme.ts           # Detección de modo claro/oscuro
│   ├── use-color-scheme.web.ts       # Variante web
│   └── use-theme-color.ts            # Resolución de colores por tema
│
├── assets/
│   └── images/                       # Íconos y splash screen
│
├── scripts/
│   └── reset-project.js              # Script de reset del proyecto
│
├── app.json                          # Configuración Expo
├── tsconfig.json                     # Configuración TypeScript
├── eslint.config.js                  # Configuración ESLint
└── package.json
```


## Librerías

Core

| Libreria | Version | Uso |
|---|---|---|
| `expo` | ~54.0.33 | `Framework base` |
| `react` | 19.1.0 | `UI` |
| `react-native` | 0.81.5 | `Runtime móvil` |
| `typescript` | ~5.9.2 | `Tipado estático` |



Navegación

| Libreria | Version | Uso |
|---|---|---|
| `expo-router` | ~6.0.23 | `Ruteo basado en archivos` |
| `@react-navigation/native` | ^7.1.8 | `Navegación base` |
| `@react-navigation/bottom-tabs` | ^7.4.0 | `Tab bar` |


Estado y datos

| Libreria | Version | Uso |
|---|---|---|
| `zustand` | ^5.0.12 | `Estado global del usuario` |
| `@tanstack/react-query` | ^5.95.2 | `Cache y sincronización de datos del servidor` |
| `axios` | ^1.14.0 | `Cliente HTTP con interceptores` |


Almacenamiento

| Libreria | Version | Uso |
|---|---|---|
| `expo-secure-store` | ~15.0.8 | `Tokens JWT (Keychain/Keystore cifrado)` |
| `@react-native-async-storage/async-storage` | 2.2.0 | `Persistencia de estado no sensible` |



Animaciones y gestos

| Libreria | Version | Uso |
|---|---|---|
| `react-native-reanimated` | ~4.1.1 | `Animaciones en hilo de UI` |
| `react-native-gesture-handler` | ~2.28.0 | `Manejo de gestos` |
| `react-native-worklets` | 0.5.1 | `Operaciones de alto rendimiento` |



UI y utilidades

| Libreria | Version | Uso |
|---|---|---|
| `react-native-calendars` | ^1.1314.0 | `Selector de fechas / rangos (vacaciones)` |
| `date-fns` | ^4.1.0 | `Formateo y cálculo de fechas` |
| `@expo/vector-icons` | ^15.0.3 | `Íconos Material e Ionicons` |
| `expo-symbols` | ~1.0.8 | `SF Symbols (iOS)` |
| `react-native-safe-area-context` | ~5.6.0 | `Áreas seguras de pantalla` |
| `expo-haptics` | ~15.0.8 | `Feedback háptico` |



## Paleta de colores

El proyecto usa un tema dark-first con acento cyan.

| Token | Hex | Uso |
|---|---|---|
| `bg` | #07101F | `Fondo principal de todas las pantallas` |
| `accent` | #00E5CC | `Color principal — botones, labels, íconos activos` |
| `accentGlow` | rgba(0,229,204,0.15) | `Fondo de tarjetas y logo mark` |
| `accentBorder` | rgba(0,229,204,0.35) | `Bordes con acento` |
| `accentShadow` | rgba(0,229,204,0.45) | `Sombra de botón principal` |
| `text` | #EDF4FF | `Texto principal` |
| `muted` | rgba(237,244,255,0.50) | `Texto secundario / placeholders` |
| `mutedLight` | rgba(237,244,255,0.12) | `Divisores y fondos sutiles` |
| `inputBg` | rgba(255,255,255,0.055) | `Fondo de campos de texto` |
| `inputBorder` | rgba(255,255,255,0.09) | `Borde de campos en reposo` |
| `inputFocus` | rgba(0,229,204,0.35) | `Borde de campos al enfocar` |
| `orb1` | rgba(0,180,216,0.16) | `Orbe decorativo azul (arriba-derecha)` |
| `orb2` | rgba(100,30,200,0.13) | `Orbe decorativo morado (abajo-izquierda)` |
| `error` | #FF6B6B | `Mensajes de error` |
| `success` | #4ADE80 | `Mensajes de éxito` |



Fuentes iOS y Android / Web

| Heavy | Bold | DemiBold | Regular |
|---|---|---|---|
| AvenirNext-Heavy | AvenirNext-Bold | AvenirNext-DemiBold | AvenirNext-Regular |
| sans-serif-condensed | sans-serif-medium | sans-serif-medium | sans-serif |

