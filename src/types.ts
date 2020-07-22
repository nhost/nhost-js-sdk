export interface Config {
  base_url: string;
  refresh_interval_time?: number;
}

export interface LoginData {
  mfa?: boolean;
  ticket?: string;
}
