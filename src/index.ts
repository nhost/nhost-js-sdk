import NhostAuth from "./Auth";
import * as types from "./types";

export default class Nhost {
  private base_url: string | null;
  private app_initialized: boolean;
  constructor() {
    this.base_url = null;
    this.app_initialized = false;
  }

  public initializeApp(config: types.Config) {
    this.base_url = config.base_url;
    this.app_initialized = true;
  }

  public auth() {
    if (!this.app_initialized || !this.base_url) {
      throw "app is not initialized. Call nhost.initializeApp(config).";
    }

    const config = {
      base_url: this.base_url,
    };

    return new NhostAuth(config);
  }
}
