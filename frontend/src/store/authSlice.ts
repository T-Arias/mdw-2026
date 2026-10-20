// Slice: la sesion (quien esta logueado). Reemplaza a AuthContext + AuthProvider (ver clase 11/sin-redux).
// No hace requests: los componentes llaman a services/auth.ts y despachan el resultado.
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../types/auth";

interface AuthState {
  user: User | null;
  checking: boolean; // true hasta que responde /auth/me al cargar la app
}

const initialState: AuthState = { user: null, checking: true };

export const authSlice = createSlice({
  name: "auth",
  initialState,
  // Cada reducer genera una accion con el mismo nombre: authSlice.actions.loggedIn(user).
  // Immer: parece que mutamos `state`, pero RTK genera un objeto nuevo por debajo.
  reducers: {
    sessionChecked: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.checking = false;
    },
    loggedIn: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    loggedOut: (state) => {
      state.user = null;
    },
  },
  selectors: {
    selectUser: (state) => state.user,
    selectChecking: (state) => state.checking,
  },
});

export const { sessionChecked, loggedIn, loggedOut } = authSlice.actions;
export const { selectUser, selectChecking } = authSlice.selectors;
