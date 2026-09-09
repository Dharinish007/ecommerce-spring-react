export interface LoginRequest {
  username: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

export interface UserInfoResponse {
  id: number;
  username: string;
  email: string;
  roles: string[];
  jwtToken?: string;
}

export interface MessageResponse {
  message: string;
}

export interface AuthState {
  user: UserInfoResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
