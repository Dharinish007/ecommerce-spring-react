import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, LoginRequest, SignupRequest, UserInfoResponse } from "@/types/auth.types";
import authApi from "@/api/auth.api";
import { extractErrorMessage } from "@/api/client";

const storedToken = localStorage.getItem("sbecom_token");
const storedUser = localStorage.getItem("sbecom_user");

let initialUser: UserInfoResponse | null = null;
if (storedUser) {
  try {
    initialUser = JSON.parse(storedUser);
  } catch {
    localStorage.removeItem("sbecom_user");
  }
}

const initialState: AuthState = {
  user: initialUser,
  token: storedToken,
  isAuthenticated: Boolean(storedToken && initialUser),
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk<
  UserInfoResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const data = await authApi.signin(credentials);
    if (data.jwtToken) {
      localStorage.setItem("sbecom_token", data.jwtToken);
    }
    localStorage.setItem("sbecom_user", JSON.stringify(data));
    return data;
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
    const data = await authApi.getUser();
    if (data.jwtToken) {
      localStorage.setItem("sbecom_token", data.jwtToken);
    }
    localStorage.setItem("sbecom_user", JSON.stringify(data));
    return data;
  } catch (err) {
    localStorage.removeItem("sbecom_token");
    localStorage.removeItem("sbecom_user");
    return rejectWithValue(extractErrorMessage(err));
  }
});

export const logout = createAsyncThunk<void, void>(
  "auth/logout",
  async () => {
    try {
      await authApi.signout();
    } catch {
      // Clean up locally even if network signout fails
    } finally {
      localStorage.removeItem("sbecom_token");
      localStorage.removeItem("sbecom_user");
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
    setCredentials: (
      state,
      action: PayloadAction<{ user: UserInfoResponse; token?: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = true;
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
      state.user = action.payload;
      state.token = action.payload.jwtToken || state.token;
      state.error = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
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

    // Fetch Current User
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
      if (action.payload.jwtToken) {
        state.token = action.payload.jwtToken;
      }
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    });
  },
});

export const { clearAuthError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
