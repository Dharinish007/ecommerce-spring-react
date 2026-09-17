import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, LoginRequest, SignupRequest, UserInfoResponse } from "@/types/auth.types";
import authApi from "@/api/auth.api";
import { extractErrorMessage } from "@/api/client";

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const login = createAsyncThunk<
  UserInfoResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    return await authApi.signin(credentials);
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const registerUser = createAsyncThunk<
  string,
  SignupRequest,
  { rejectValue: string }
>("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const data = await authApi.signup(userData);
    return data.message || "Registration successful!";
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const fetchCurrentUser = createAsyncThunk<
  UserInfoResponse,
  void,
  { rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
  try {
    return await authApi.getUser();
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async () => {
    try {
      await authApi.signout();
    } catch {
      // Complete local logout even if network signout fails
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    sessionExpired: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserInfoResponse }>
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.error = action.payload || "Login failed.";
    });

    // Register
    builder.addCase(registerUser.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state) => {
      state.isLoading = false;
      state.error = null;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload || "Registration failed.";
    });

    // Fetch Current User (Session Restoration)
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.isInitialized = true;
      state.user = action.payload;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.isInitialized = true;
      state.user = null;
      state.error = null;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
  },
});

export const { clearAuthError, sessionExpired, setCredentials } = authSlice.actions;
export default authSlice.reducer;
