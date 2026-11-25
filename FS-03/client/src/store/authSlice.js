import { createSlice } from "@reduxjs/toolkit";

export const TOKEN_KEY = "learnlive_token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: { token: readToken(), user: null },
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user ?? null;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;