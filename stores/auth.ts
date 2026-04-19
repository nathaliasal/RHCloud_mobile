import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '@/services/auth';

interface AuthStore {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'rhcloud.auth.store',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistimos el perfil del usuario, no las funciones
      partialize: (state) => ({ user: state.user }),
    }
  )
);
