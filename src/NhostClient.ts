import NhostAuth from "./Auth";
import NhostStorage from "./Storage";
import JWTMemory from "./JWTMemory";
import * as types from "./types";

export default class NhostClient {
  private base_url: string | null;
  private use_cookies: boolean;
  private refresh_interval_time: number | null;
  private client_storage: types.ClientStorage;
  private client_storage_type: string;
  private JWTMemory: JWTMemory;
  private ssr: boolean;

  auth: NhostAuth;
  storage: NhostStorage;

  constructor(config: types.UserConfig) {
    if (!config.base_url)
      throw "The client needs a base_url. Read more here: https://docs.nhost.io/libraries/nhost-js-sdk#setup.";

    this.JWTMemory = new JWTMemory();
    this.base_url = config.base_url;
    this.use_cookies = config.use_cookies ? config.use_cookies : false;
    this.refresh_interval_time = config.refresh_interval_time || null; // 10 minutes (600 seconds)
    this.ssr = typeof window === "undefined";

    this.client_storage = this.ssr
      ? {}
      : config.client_storage || window.localStorage;

    this.client_storage_type = config.client_storage_type
      ? config.client_storage_type
      : "web";

    const authConfig = {
      base_url: this.base_url,
      use_cookies: this.use_cookies,
      refresh_interval_time: this.refresh_interval_time,
      client_storage: this.client_storage,
      client_storage_type: this.client_storage_type,
      ssr: this.ssr,
    };
    this.auth = new NhostAuth(authConfig, this.JWTMemory);

    const storageConfig = {
      base_url: this.base_url,
      use_cookies: this.use_cookies,
    };

    this.storage = new NhostStorage(storageConfig, this.JWTMemory);
  }
}
