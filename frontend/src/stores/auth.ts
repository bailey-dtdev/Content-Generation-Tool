import { create } from "zustand";

import { AuthService, type UserResponse } from "@/api/generated";

type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: UserResponse | null;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: "unknown",
  user: null,
  fetchMe: async () => {
    try {
      const user = await AuthService.authMe();
      set({ status: "authenticated", user });
    } catch {
      set({ status: "unauthenticated", user: null });
    }
  },
  logout: async () => {
    try {
      await AuthService.authLogout();
    } finally {
      set({ status: "unauthenticated", user: null });
    }
  },
}));
