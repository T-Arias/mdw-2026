# Clase 11 — Estado global: Redux Toolkit + RTK Query

Sigue a `clase 10/README.md`. Explicacion detallada en `teoria.md`; codigo en `frontend/src/store/`.

---

## 1. Setup

```bash
cd frontend
npm install @reduxjs/toolkit react-redux
```

| Paquete | Version | Para que |
|---|---|---|
| `@reduxjs/toolkit` | 2.13 | `configureStore`, `createSlice` y RTK Query (`createApi`). No se instala `redux` aparte |
| `react-redux` | 9.3 | Conecta React con el store: `<Provider>`, `useSelector`, `useDispatch` |

Las dos traen sus propios tipos. Extension del navegador: **Redux DevTools** (Chrome / Firefox).

**Crear el store** (`store/index.ts`):

```ts
export const store = configureStore({
  reducer: {
    [authSlice.reducerPath]: authSlice.reducer,
    [studentsApi.reducerPath]: studentsApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(studentsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
```

**Envolver la app** (`main.tsx`):

```tsx
<Provider store={store}>
  <RouterProvider router={router} />
</Provider>
```

---

## 2. Conceptos base de Redux

```
 componente ──dispatch(accion)──▶ store ──reducer──▶ nuevo state
     ▲                                                   │
     └──────────── useAppSelector(selector) ◀────────────┘
```

| Concepto | Que es |
|---|---|
| **Store** | Un unico objeto con todo el estado global. Se crea con `configureStore` |
| **Action** | Objeto que describe *que paso*: `{ type: "auth/loggedIn", payload: user }` |
| **Dispatch** | Enviar una accion al store: `dispatch(loggedIn(user))`. Unica forma de cambiar el estado |
| **Reducer** | Funcion pura `(state, action) => nuevo state`. Sin requests ni efectos |
| **Selector** | Funcion que lee un pedazo del state. El componente se re-renderiza |
| **Slice** | Una rama del store creada con `createSlice`: estado inicial + reducers + acciones + selectores |

```ts
export const authSlice = createSlice({
  name: "auth",
  initialState: { user: null, checking: true },
  reducers: {
    loggedIn: (state, action: PayloadAction<User>) => { state.user = action.payload; },
    loggedOut: (state) => { state.user = null; },
  },
  selectors: { selectUser: (state) => state.user },
});
```

- `createSlice` genera las acciones solo: `authSlice.actions.loggedIn(user)`.
- **Immer**: `state.user = ...` parece una mutacion, pero RTK arma un objeto nuevo por debajo. Solo
  vale dentro de `createSlice`.

---

## 3. Conceptos base de RTK Query

Para datos del servidor (cache, loading, error, refetch). Viene dentro de `@reduxjs/toolkit`.

```ts
export const studentsApi = createApi({
  reducerPath: "studentsApi",
  baseQuery: axiosBaseQuery,
  tagTypes: ["Students"],
  endpoints: (build) => ({
    getStudents: build.query<Student[], void>({ query: ..., providesTags: ["Students"] }),
    createStudent: build.mutation<Student, StudentFormValues>({ query: ..., invalidatesTags: ["Students"] }),
  }),
});

export const { useGetStudentsQuery, useCreateStudentMutation } = studentsApi;
```

| Concepto | Que es |
|---|---|
| **`createApi`** | Define los endpoints. Genera reducer (la cache), middleware (los requests) y hooks |
| **`baseQuery`** | Como se hace cada request (`fetchBaseQuery` o una propia con axios) |
| **Query** | Lectura. `useGetStudentsQuery()` → `{ data, isLoading, error }` |
| **Mutation** | Escritura. `useCreateStudentMutation()` → `[trigger, estado]` |
| **Cache** | Cada endpoint + argumentos se pide una vez y se comparte entre componentes |
| **`providesTags` / `invalidatesTags`** | La query marca sus datos; la mutation los invalida → refetch automatico |
| **`.unwrap()`** | Convierte el resultado de una mutation en una Promise que lanza si hubo error |
