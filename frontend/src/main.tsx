import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router/dom";
import axios from "axios";
import "./index.css";
import { api } from "./lib/api";
import * as authService from "./services/auth";
import { store } from "./store";
import { loggedOut, sessionChecked } from "./store/authSlice";
import { router } from "./router";

// El store vive fuera de React: se puede despachar desde aca, sin useEffect ni Provider.

// Sesion persistente: la cookie httpOnly sobrevive al F5, /auth/me dice de quien es.
authService
  .getMe()
  .then((user) => store.dispatch(sessionChecked(user)))
  .catch(() => store.dispatch(sessionChecked(null)));

// Un 401 con sesion abierta = cookie vencida: se cierra la sesion local.
// Sin sesion no se despacha nada: /auth/me al cargar y un login fallido tambien responden 401.
api.interceptors.response.use(undefined, (error: unknown) => {
  const unauthorized = axios.isAxiosError(error) && error.response?.status === 401;
  if (unauthorized && store.getState().auth.user) {
    store.dispatch(loggedOut());
  }
  throw error;
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>,
);
