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

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Estructura del proyecto

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


## Librerías

Core

| Libreria | Version | Uso |
|---|---|---|
| `expo` | ~54.0.33 | `Framework base` |
| `react` | 19.1.0 | `UI` |
| `react-native` | 0.81.5 | `Runtime móvil` |
| `typescript` | ~5.9.2 | `Tipado estático` |
