import type {
  CreateAddressRequest,
  CreateAddressResponse,
  DeleteAddressResponse,
  GetProfileResponse,
  ListAddressesResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RegisterRequest,
  RegisterResponse,
  UpdateAddressRequest,
  UpdateAddressResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from "@pk-literature/contracts";
import type { Fetcher } from "./fetcher";

export function register(fetcher: Fetcher, body: RegisterRequest): Promise<RegisterResponse> {
  return fetcher("/v1/auth/register", { method: "POST", body: JSON.stringify(body) });
}

export function login(fetcher: Fetcher, body: LoginRequest): Promise<LoginResponse> {
  return fetcher("/v1/auth/login", { method: "POST", body: JSON.stringify(body) });
}

export function logout(fetcher: Fetcher): Promise<LogoutResponse> {
  return fetcher("/v1/auth/logout", { method: "POST" });
}

export function getProfile(fetcher: Fetcher): Promise<GetProfileResponse> {
  return fetcher("/v1/profile");
}

export function updateProfile(fetcher: Fetcher, body: UpdateProfileRequest): Promise<UpdateProfileResponse> {
  return fetcher("/v1/profile", { method: "PATCH", body: JSON.stringify(body) });
}

export function listAddresses(fetcher: Fetcher): Promise<ListAddressesResponse> {
  return fetcher("/v1/addresses");
}

export function createAddress(fetcher: Fetcher, body: CreateAddressRequest): Promise<CreateAddressResponse> {
  return fetcher("/v1/addresses", { method: "POST", body: JSON.stringify(body) });
}

export function updateAddress(fetcher: Fetcher, id: string, body: UpdateAddressRequest): Promise<UpdateAddressResponse> {
  return fetcher(`/v1/addresses/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export function deleteAddress(fetcher: Fetcher, id: string): Promise<DeleteAddressResponse> {
  return fetcher(`/v1/addresses/${id}`, { method: "DELETE" });
}
