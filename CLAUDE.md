# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.
User instructions always override this file.

---

## Commands

```bash
npm start            # Start Expo dev server (scan QR with Expo Go)
npm run android      # Run on Android emulator
npm run ios          # Run on iOS simulator
npm run web          # Run on web browser
npm run lint         # Run ESLint (expo lint)
```

> ⚠️ No test runner configured yet. Do NOT run `node ./scripts/reset-project.js` — it wipes the project to blank state.

---

## Architecture

### Navigation

Expo Router (file-based). Root layout at `app/_layout.tsx` wraps everything in `QueryClientProvider`.

| Route | Type | Description |
|---|---|---|
| `app/(tabs)/index.tsx` | Tab | Inicio (Home) |
| `app/(tabs)/ingresar.tsx` | Tab | Login |
| `app/(tabs)/mi-perfil.tsx` | Tab | Mi Perfil |
| `app/complete-profile.tsx` | Stack/Modal | Completar perfil |
| `app/edit-profile.tsx` | Stack/Modal | Editar perfil |
| `app/change-password.tsx` | Stack/Modal | Cambiar contraseña |
| `app/reset-password.tsx` | Stack/Modal | Resetear contraseña |

### State Management

Two-layer approach — do not mix these:

- **Zustand** (`stores/auth.ts`) — persisted user profile in AsyncStorage under key `rhcloud.auth.store`
- **TanStack React Query v5** — server state (profiles, document types, genders). Stale time: 5 min, 1 retry.

Rule: user identity/session → Zustand. API-fetched data → React Query. Never put API data in Zustand.

### API Layer

`services/http.ts` — Axios instance pointing to `http://rh-cloud-51.38.33.160.traefik.me`.

Two interceptors:

1. **Request:** Attaches Bearer token from `expo-secure-store`
2. **Response:** On 401 → queues pending requests → attempts token refresh → on refresh failure: clears tokens + resets Zustand user + redirects to login

Service files: `services/auth.ts`, `services/persons.ts`, `services/users.ts`
All endpoint strings live in `constants/api.ts` — never hardcode URLs in service files.

### Auth Flow

```
App init → read tokens (SecureStore) → getMe() → populate Zustand store
Logout   → clearTokens() + useAuthStore.clearUser() + navigate to login
```

Token storage:

- Access token + Refresh token → `expo-secure-store` (Keychain/Keystore)
- User object → Zustand (AsyncStorage, key: `rhcloud.auth.store`)

### Path Aliases

`@/` resolves to project root (configured in `tsconfig.json`).
Always use `@/components/...`, `@/services/...`, `@/stores/...`, etc. Never use relative `../../` imports.

### Theming

Dark-first color palette defined in `constants/theme.ts`.

| Token | Value | Use |
|---|---|---|
| Background | `#07101F` | Screens, containers |
| Accent | `#00E5CC` | CTAs, highlights, active states |
| Text | `#EDF4FF` | Primary text |
| Error | `#FF6B6B` | Validation, error states |
| Success | `#4ADE80` | Confirmations |

Typography is platform-specific: **AvenirNext** on iOS, system sans-serif on Android/Web.
Always use `Fonts` from `constants/theme.ts` — never hardcode font names or sizes.

Components:

- `ThemedText` — resolves text color via `useThemeColor`
- `ThemedView` — resolves background via `useThemeColor`
- Pass `lightColor`/`darkColor` props or rely on `Colors` constants

### Key Dependencies

| Purpose | Library |
|---|---|
| Navigation | `expo-router`, `@react-navigation/native` |
| Global state | `zustand` |
| Server state | `@tanstack/react-query` |
| HTTP | `axios` |
| Secure storage | `expo-secure-store` |
| Persistent storage | `@react-native-async-storage/async-storage` |
| Animations | `react-native-reanimated`, `react-native-gesture-handler` |
| Calendar/dates | `react-native-calendars`, `date-fns` |
| Icons | `@expo/vector-icons`, `expo-symbols` |

---

## Conventions

### New screen checklist

Before creating a new screen, verify:

1. File lives under `app/` following Expo Router conventions
2. Use `ThemedView` as root container
3. Use `ThemedText` for all text — never `<Text>` directly
4. Use `Fonts` from `constants/theme.ts` for all typography in `StyleSheet`
5. Use `useThemeColor` or `Colors` constants for custom colors — never hardcode hex
6. Use `@/` path aliases for all imports
7. If it fetches data: use React Query (`useQuery` / `useMutation`)
8. If it needs auth state: use `useAuthStore` from `stores/auth.ts`
9. Export as a default function component

### New service / endpoint checklist

1. Add the endpoint string to `constants/api.ts`
2. Create or extend the service file in `services/`
3. Use the Axios instance from `services/http.ts` — never create a new Axios instance
4. Return typed responses — define interfaces or types in the same file or `types/`
5. Never handle 401 inside a service — the HTTP interceptor owns that

### Styling rules

- Always use `StyleSheet.create` — no inline style objects
- No NativeWind, no Tamagui, no styled-components
- Never hardcode color hex values — use `Colors` from `constants/theme.ts`
- Never hardcode font names or sizes — use `Fonts` from `constants/theme.ts`
- Animations: use `react-native-reanimated` (already installed) — not `Animated` from RN core

### TypeScript rules

- Strict mode is enabled — no `any`, no `as any`
- All props must be typed with interfaces or types
- API responses must be typed — no untyped `data` objects
- React Compiler is enabled (`app.json`) — do NOT manually add `useMemo` / `useCallback` for performance; the compiler handles it

---

## Common patterns

### Authenticated API call with React Query

```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => getProfile(userId),
  staleTime: 5 * 60 * 1000,
  retry: 1,
})
```

### Mutation with error handling

```tsx
const mutation = useMutation({
  mutationFn: updateProfile,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  },
  onError: (error) => {
    // Handle error — show to user
  },
})
```

### Read auth state

```tsx
const { user, clearUser } = useAuthStore()
```

### Themed component

```tsx
import { ThemedView } from '@/components/ThemedView'
import { ThemedText } from '@/components/ThemedText'
import { Colors, Fonts } from '@/constants/theme'

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: Fonts.sizes.lg, fontFamily: Fonts.primary },
})
```

---

## What NOT to do

- Don't create a new Axios instance — use `services/http.ts`
- Don't hardcode URLs — add them to `constants/api.ts`
- Don't put server/API data in Zustand — use React Query
- Don't hardcode colors or fonts — use `constants/theme.ts`
- Don't use relative `../../` imports — use `@/`
- Don't manually add `useMemo`/`useCallback` for perf — React Compiler handles it
- Don't use `Animated` from React Native core — use Reanimated
- Don't handle 401 in service files — the HTTP interceptor owns that
- Don't run `reset-project.js`

---

## Compact instructions

When compacting, preserve:

- The current auth flow state and any token-related changes
- List of modified files in this session
- Any unresolved errors or pending tasks
- API endpoints added or modified

---

## Approach

- Read existing files before writing code — understand the pattern first
- Prefer editing over rewriting whole files
- Keep solutions simple and direct
- Do not re-read files already read unless the file may have changed
- Verify mentally that code compiles and types check before declaring done
- Be concise in output, thorough in reasoning
- No sycophantic openers or closing fluff
