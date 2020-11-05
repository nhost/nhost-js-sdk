export interface UserConfig {
  base_url: string;
  use_cookies?: boolean;
  refresh_interval_time?: number | null;
  client_storage?: ClientStorage;
  client_storage_type?: string;
}

export interface AuthConfig {
  base_url: string;
  use_cookies: boolean;
  refresh_interval_time: number | null;
  client_storage: ClientStorage;
  client_storage_type: string;
  ssr?: boolean;
}

export interface StorageConfig {
  base_url: string;
  use_cookies: boolean;
}

export interface ClientStorage {
  // localStorage
  // AsyncStorage
  // https://react-native-community.github.io/async-storage/docs/usage
  setItem?: (key: string, value: unknown) => void;
  getItem?: (key: string) => any;
  removeItem?: (key: string) => void;

  // capacitor
  set?: (options: { key: string; value: string }) => void;
  get?: (options: { key: string }) => any;
  remove?: (options: { key: string }) => void;

  // expo-secure-storage
  setItemAsync?: (key: string, value: string) => void;
  getItemAsync?: (key: string) => any;
  deleteItemAsync?: (key: string) => void;
}

// supported client storage types
export type ClientStorageType =
  | "web"
  | "react-native"
  | "capacitor"
  | "expo-secure-storage";

export interface LoginData {
  mfa?: boolean;
  ticket?: string;
}

export interface Headers {
  Authorization?: string;
}
