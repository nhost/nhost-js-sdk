export interface UserConfig {
  baseURL: string;
  useCookies?: boolean;
  refreshIntervalTime?: number | null;
  clientStorage?: ClientStorage;
  clientStorageType?: string;
  autoLogin?: boolean;
  ssr?: boolean;
}

export interface AuthConfig {
  baseURL: string;
  useCookies: boolean;
  refreshIntervalTime: number | null;
  clientStorage: ClientStorage;
  clientStorageType: string;
  ssr?: boolean;
  autoLogin: boolean;
}

export interface StorageConfig {
  baseURL: string;
  useCookies: boolean;
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

export type Provider =
  | "apple"
  | "facebook"
  | "github"
  | "google"
  | "linkedin"
  | "spotify"
  | "twitter"
  | "windowslive";

export interface loginCredentials {
  email?: string;
  password?: string;
  provider?: Provider;
}
export interface registerCredentials {
  email: string;
  password: string;
  registrationOptions?: {
    userData?: any;
    defaultRole?: string;
    allowedRoles?: string[];
  };
}
export interface Session {
  jwt_token: string;
  jwt_expires_in: number;
  refresh_token?: string; // not present if useCookie
  user: User;
}

export interface User {
  id: string;
  email?: string;
  display_name?: string;
  avatar_url?: string;
}
