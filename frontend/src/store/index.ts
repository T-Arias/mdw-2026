// El store: un unico objeto con todo el estado global. Cada reducer es una "rama" del arbol.
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { authSlice } from "./authSlice";
import { studentsApi } from "./api";

export const store = configureStore({
  reducer: {
    [authSlice.reducerPath]: authSlice.reducer, // state.auth        -> { user, checking }
    [studentsApi.reducerPath]: studentsApi.reducer, // state.studentsApi -> cache de RTK Query
  },
  // El middleware de RTK Query maneja la cache, el refetch y la invalidacion por tags.
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(studentsApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// useSelector / useDispatch ya tipados con nuestro store.
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
