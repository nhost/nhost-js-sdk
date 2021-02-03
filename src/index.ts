import NhostAuth from "./Auth";
import NhostStorage from "./Storage";
import JWTMemory from "./JWTMemory";
import * as types from "./types";

class Nhost {
  private baseURL: string | null;
  private appInitialized: boolean;
  private useCookies: boolean;
  private refreshIntervalTime: number | null;
  private clientStorage: types.ClientStorage;
  private clientStorageType: string;
  private JWTMemory: JWTMemory;
  private ssr: boolean;

  constructor() {
    this.baseURL = null;
    this.appInitialized = false;
    this.useCookies = false;
    this.JWTMemory = new JWTMemory();
  }

  public initializeApp(config: types.UserConfig) {
    if ("base_url" in config) {
      return console.error(
        "use `baseURL` instead of `base_url` to initiate nhost"
      );
    }

    if ("baseUrl" in config) {
      return console.error(
        "use `baseURL` (URL is uppercase) instead of `baseUrl` to initiate nhost"
      );
    }

    this.baseURL = config.baseURL;
    this.appInitialized = true;
    this.useCookies = config.useCookies ? config.useCookies : false;
    this.refreshIntervalTime = config.refreshIntervalTime || null; // 10 minutes (600 seconds)
    this.ssr = typeof window === "undefined";
    this.clientStorage = this.ssr
      ? {}
      : config.clientStorage || window.localStorage;
    this.clientStorageType = config.clientStorageType
      ? config.clientStorageType
      : "web";
  }

  public auth() {
    if (!this.appInitialized || !this.baseURL) {
      throw "app is not initialized. Call nhost.initializeApp(config). Read more at: https://docs.nhost.io/libraries/nhost-js-sdk#setup.";
    }

    const config = {
      baseURL: this.baseURL,
      useCookies: this.useCookies,
      refreshIntervalTime: this.refreshIntervalTime,
      clientStorage: this.clientStorage,
      clientStorageType: this.clientStorageType,
      ssr: this.ssr,
    };

    return new NhostAuth(config, this.JWTMemory);
  }

  public storage() {
    if (!this.appInitialized || !this.baseURL) {
      throw "app is not initialized. Call nhost.initializeApp(config). Read more here: https://docs.nhost.io/libraries/nhost-js-sdk#setup.";
    }

    const config = {
      baseURL: this.baseURL,
      useCookies: this.useCookies,
    };

    return new NhostStorage(config, this.JWTMemory);
  }
}

export default new Nhost();
