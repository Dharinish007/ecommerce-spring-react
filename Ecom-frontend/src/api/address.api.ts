import apiClient from "./client";
import { AddressDTO } from "@/types/address.types";
import { APIResponse } from "@/types/common.types";

export const addressApi = {
  getUserAddresses: async (): Promise<AddressDTO[]> => {
    const response = await apiClient.get<AddressDTO[]>("/user/addresses");
    return response.data;
  },

  createAddress: async (address: AddressDTO): Promise<AddressDTO> => {
    const response = await apiClient.post<AddressDTO>("/addresses", address);
    return response.data;
  },

  getAddressById: async (addressId: number): Promise<AddressDTO> => {
    const response = await apiClient.get<AddressDTO>(`/addresses/${addressId}`);
    return response.data;
  },

  updateAddress: async (addressId: number, address: AddressDTO): Promise<AddressDTO> => {
    const response = await apiClient.put<AddressDTO>(`/addresses/${addressId}`, address);
    return response.data;
  },

  deleteAddress: async (addressId: number): Promise<APIResponse> => {
    const response = await apiClient.delete<APIResponse>(`/addresses/${addressId}`);
    return response.data;
  },
};

export default addressApi;
