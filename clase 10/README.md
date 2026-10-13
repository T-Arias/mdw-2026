# Clase 10 — Formularios: React Hook Form + Zod

Sigue a `clase 9/README.md`. El Login hecho a mano con `useState` pasa a React Hook Form + Zod, y el
placeholder de `/admin` pasa a ser el ABM real de estudiantes. Explicacion detallada en `teoria.md`;
codigo en `frontend/src/`.

**Entregable:** login y ABM de estudiantes desde el frontend.

---

## 1. Comandos

```bash
cd frontend
npm install react-hook-form @hookform/resolvers zod
```

| Paquete | Version | Para que |
|---|---|---|
| `react-hook-form` | 7.90 | Estado del formulario: valores, errores, envio |
| `@hookform/resolvers` | 5.9 | Conecta un schema (Zod) con `useForm` |
| `zod` | 4.6 | Las reglas de validacion. Ya se usaba en el backend, hoy llega al front |

- Si `npm` instala `zod@3.x`, forzar la 4: `npm install zod@^4`. Las versiones tienen que coincidir
  con el backend (`backend/package.json`).
- Las tres traen sus propios tipos.

Correr (dos terminales): `cd backend && npm run dev` · `cd frontend && npm run dev`.

Para probar el ABM hace falta un usuario ADMIN:
`db.users.updateOne({ email: "..." }, { $set: { role: "ADMIN" } })` y volver a loguearse.

---

## 2. Las piezas de `useForm`

```tsx
const {
  register,
  handleSubmit,
  setError,
  reset,
  formState: { errors, isSubmitting },
} = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });
```

| Pieza | Para que |
|---|---|
| `resolver: zodResolver(schema)` | Valida con Zod. Los tipos del form se **infieren del schema**, sin generic |
| `defaultValues` | Valores iniciales. Se leen **una sola vez**, al montar |
| `values` | Valores que vienen de afuera (props, API). Si cambian, el form se resetea solo |
| `register("campo")` | Conecta un input: `<input {...register("email")} />` |
| `handleSubmit(fn)` | Valida antes; `fn` solo corre si todo es valido y recibe los datos ya limpios |
| `formState.errors` | `errors.email?.message` → error bajo cada input |
| `formState.isSubmitting` | `true` mientras `fn` (async) no termino → deshabilitar el boton |
| `setError("root.server", { message })` | Error que no es de un campo (401, 404, red) |
| `reset(valores)` | Vuelve el form a esos valores y limpia errores |

`<form noValidate>`: apaga la validacion nativa del navegador para que los mensajes sean siempre los
de Zod.

---

## 3. Schemas del front (Zod 4)

`schemas/auth.schema.ts` y `schemas/student.schema.ts`: mismas reglas que
`backend/src/schemas/*.schema.ts`.

```ts
export const studentSchema = z.object({
  firstName: z.string().trim().min(1, { error: "El nombre es obligatorio" }).max(80),
  lastName: z.string().trim().min(1, { error: "El apellido es obligatorio" }).max(80),
  email: z.email({ error: "El email no tiene un formato valido" }).trim().toLowerCase(),
  career: z.string().trim().min(1, { error: "La carrera es obligatoria" }),
  active: z.boolean(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
```

Cambios de Zod 4 respecto de lo que se ve en tutoriales viejos:

| Zod 3 (deprecado) | Zod 4 |
|---|---|
| `z.string().email()` | `z.email()` |
| `.min(1, "mensaje")` / `{ message }` | `.min(1, { error: "mensaje" })` |

---

## 4. Backend

Un solo cambio en `routes/students.routes.ts`: crear, editar y borrar exigen sesion **y** rol ADMIN.

```ts
const onlyAdmin = [authMiddleware, requireRole("ADMIN")];

router.post("/", onlyAdmin, validateBody(createStudentSchema), createStudent);
router.put("/:id", onlyAdmin, validateBody(updateStudentSchema), updateStudent);
router.delete("/:id", onlyAdmin, deleteStudent);
```

Antes `POST`/`PUT` estaban abiertos y `DELETE` tenia `requireRole` sin `authMiddleware` (siempre 401).
"El front esconde, el back protege": el guard de `/admin` no alcanza.

---

## 5. ABM en `/admin`

```
Admin.tsx (estado: students, editing, error)
 ├─ useEffect → getStudents()                    listado
 ├─ <StudentForm student={editing} onSave onCancel />
 │    ├─ editing = null    → alta   → createStudent
 │    └─ editing = Student → edicion → updateStudent   (mismo form, precargado con `values`)
 └─ por item: [Editar] → setEditing(student) · [Eliminar] → confirm → deleteStudent
```

- El form no conoce la API: recibe `onSave` y, si tira error, lo muestra con `setError("root.server")`.
- El listado se actualiza sin volver a pedirlo: `map` al editar, `[...prev, nuevo]` al crear,
  `filter` al borrar.
- `DELETE` responde `204` sin body: axios lo maneja sin cambios.

---

## 6. Estructura de carpetas (cambios)

```
frontend/src/
├── schemas/
│   ├── auth.schema.ts         -> loginSchema (nuevo)
│   └── student.schema.ts      -> studentSchema, emptyStudent, toStudentFormValues (nuevo)
├── components/admin/
│   └── StudentForm.tsx        -> form de alta/edicion (nuevo)
├── pages/
│   ├── Login.tsx              -> migrado a React Hook Form
│   └── Admin.tsx              -> ABM de estudiantes
└── services/students.ts       -> + createStudent, updateStudent, deleteStudent
```

---

## 7. Troubleshooting

| Sintoma | Causa |
|---|---|
| No aparecen los errores de Zod | Falta `resolver`, o el nombre de `register("...")` no coincide con el schema |
| El form de edicion no se precarga | Se paso el estudiante en `defaultValues` (solo se lee al montar). Usar `values` |
| Sale el mensaje del navegador y no el de Zod | Falta `noValidate` en el `<form>` |
| `401` al crear/editar/borrar | No hay sesion, o el rol cambio en la base y no se volvio a loguear |
| `403` al crear/editar/borrar | El usuario no es ADMIN |
| El checkbox llega como string | Falta `type="checkbox"` en el input: con el, `register` devuelve boolean |

## 8. Ejercicio

Migrar `pages/Register.tsx` con el mismo patron: `registerSchema` en `schemas/auth.schema.ts`
(espejo del backend), `useForm` + `zodResolver`, errores por campo y `setError("root.server")`.
