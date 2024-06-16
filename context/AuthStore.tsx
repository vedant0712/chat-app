import {create} from 'zustand';

// interface User {
//     id: string;
//     name: string;
//     email: string;
// }

interface AuthState {
  user: any | null;
  setUser: (user: any | null) => void;
  error: Error | null;
  setError: (error: Error | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  error: null,
  setError: (error) => set({ error }),
}));