import apiClient from "./client";
import { LoginRequest, SignupRequest, UserInfoResponse, MessageResponse } from "@/types/auth.types";

export const authApi = {
  signin: async (data: LoginRequest): Promise<UserInfoResponse> => {
    const response = await apiClient.post<UserInfoResponse>("/auth/signin", data);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>("/auth/signup", data);
    return response.data;
  },

  getUser: async (): Promise<UserInfoResponse> => {
    const response = await apiClient.get<UserInfoResponse>("/auth/user");
    return response.data;
  },

  signout: async (): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>("/auth/signout");
    return response.data;
  },

  updateUserRoles: async (userId: number, roles: string[]): Promise<MessageResponse> => {
    const response = await apiClient.put<MessageResponse>(`/auth/admin/users/${userId}/roles`, roles);
    return response.data;
  },
};

export default authApi;
