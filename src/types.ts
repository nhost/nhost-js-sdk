export interface Config {
  base_url: string;
  use_cookies: boolean;
  refresh_interval_time: number;
  client_storage: ClientStorage;
}

export interface ClientStorage {
  setItem: (key: string, value: unknown) => void;
  getItem: (key: string) => unknown;
  clear: () => void;
}

export interface LoginData {
  mfa?: boolean;
  ticket?: string;
}
