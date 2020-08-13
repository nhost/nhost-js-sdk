import NhostAuth from "./Auth";
import NhostStorage from "./Storage";
import JWTMemory from "./JWTMemory";
import * as types from "./types";

class Nhost {
  private base_url: string | null;
  private app_initialized: boolean;
  private use_cookies: boolean;
  private refresh_interval_time: number;
  private client_storage: types.ClientStorage;
  private JWTMemory: JWTMemory;

  constructor() {
    this.base_url = null;
    this.app_initialized = false;
    this.use_cookies = false;

    this.JWTMemory = new JWTMemory();
  }

  public initializeApp({
    base_url,
    use_cookies = false,
    refresh_interval_time = 30,
    client_storage = localStorage,
  }: types.Config) {
    this.base_url = base_url;
    this.app_initialized = true;
    this.use_cookies = use_cookies;
    this.refresh_interval_time = refresh_interval_time;
    this.client_storage = client_storage;
  }

  public auth() {
    if (!this.app_initialized || !this.base_url) {
      throw "app is not initialized. Call nhost.initializeApp(config). Read more here: https://docs.nhost.io/libraries/nhost-js-sdk#setup.";
    }

    const {
      base_url,
      use_cookies,
      refresh_interval_time,
      client_storage,
    } = this;

    const config = {
      base_url,
      use_cookies,
      refresh_interval_time,
      client_storage,
    };

    return new NhostAuth(config, this.JWTMemory);
  }

  public storage() {
    if (!this.app_initialized || !this.base_url) {
      throw "app is not initialized. Call nhost.initializeApp(config). Read more here: https://docs.nhost.io/libraries/nhost-js-sdk#setup.";
    }

    const { base_url, use_cookies, refresh_interval_time } = this;

    const config = {
      base_url,
      use_cookies,
      refresh_interval_time,
    };

    return new NhostStorage(config, this.JWTMemory);
  }
}

export default new Nhost();
