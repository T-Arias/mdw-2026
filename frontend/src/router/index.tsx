// Arbol de rutas centralizado (data router). Tres niveles de acceso: publico, privado y privado por perfil.
import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "../layouts/Layout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Home } from "../pages/Home";
import { StudentDetail } from "../pages/StudentDetail";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Profile } from "../pages/Profile";
import { Admin } from "../pages/Admin";
import { Sessions } from "../pages/Sessions";
import { NotFound } from "../pages/NotFound";

export const router = createBrowserRouter([
  // Fuera del Layout: pantalla completa, sin header
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      // Redireccion fija: el loader corre antes de renderizar, asi el Layout no llega a montarse
      { index: true, loader: () => redirect("/login") },

      // Publicas
      { path: "home", element: <Home /> },
      { path: "students/:id", element: <StudentDetail /> },

      {
        element: <ProtectedRoute />,
        children: [{ path: "perfil", element: <Profile /> }],
      },

      {
        element: <ProtectedRoute roles={["ADMIN"]} />,
        children: [
          // Ruta sin element: solo agrupa por URL (/admin, /admin/sesiones) y renderiza a la hija directo
          {
            path: "admin",
            children: [
              { index: true, element: <Admin /> },
              { path: "sesiones", element: <Sessions /> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
