import { configureStore } from "@reduxjs/toolkit";
import auth, { TOKEN_KEY } from "./authSlice";
import courses from "./coursesSlice";

export const store = configureStore({ reducer: { auth, courses } });

store.subscribe(() => {
  const { token } = store.getState().auth;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
});