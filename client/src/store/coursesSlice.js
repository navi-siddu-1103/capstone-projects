import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// VITE_API_URL already includes /api (e.g. https://your-backend.run.app/api), so do NOT append /api again
const API = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const fetchCourses = createAsyncThunk(
  "courses/fetch",
  async (_, { getState, rejectWithValue }) => {
    const { token } = getState().auth;
    const res = await fetch(`${API}/courses`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return rejectWithValue("Could not load courses");
    return res.json();
  }
);

const coursesSlice = createSlice({
  name: "courses",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCourses.pending, (s) => {
        s.status = "loading";
      })
      .addCase(fetchCourses.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.items = Array.isArray(a.payload) ? a.payload : a.payload.courses ?? [];
      })
      .addCase(fetchCourses.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload ?? "Could not load courses";
      });
  },
});

export default coursesSlice.reducer;