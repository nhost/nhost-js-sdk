// @ts-nocheck
import axios, { AxiosInstance } from "axios";
import queryString from "query-string";
import * as types from "./types";
import JWTMemory from "./JWTMemory";

export default class Auth {
  private http_client: AxiosInstance;
  private token_changed_functions: Function[];
  private auth_changed_functions: Function[];
  private login_state: boolean | null;
  private refresh_interval: any;
  private use_cookies: boolean;
  private refresh_interval_time: number | null;
  private client_storage: types.ClientStorage;
  private client_storage_type: string;
  private JWTMemory: JWTMemory;
  private ssr: boolean;

  constructor(config: types.AuthConfig, JWTMemory: JWTMemory) {
    const {
      base_url,
      use_cookies,
      refresh_interval_time,
      client_storage,
      client_storage_type,
      ssr,
    } = config;

    this.use_cookies = use_cookies;
    this.refresh_interval_time = refresh_interval_time;
    this.client_storage = client_storage;
    this.client_storage_type = client_storage_type;
    this.login_state = null;
    this.token_changed_functions = [];
    this.auth_changed_functions = [];
    this.refresh_interval;
    this.JWTMemory = JWTMemory;
    this.ssr = ssr;

    this.http_client = axios.create({
      baseURL: `${base_url}/auth`,
      timeout: 10000,
      withCredentials: this.use_cookies,
    });

    // get refresh token from query param (from externa OAuth provider callback)
    let refresh_token: string | null = null;

    if (!ssr) {
      try {
        const parsed = queryString.parse(window.location.search);
        refresh_token =
          "refresh_token" in parsed ? (parsed.refresh_token as string) : null;

        if (refresh_token) {
          let new_url = this._removeParam(
            "refresh_token",
            window.location.href
          );
          try {
            window.history.pushState({}, document.title, new_url);
          } catch {
            // noop
            // window object not available
          }
        }
      } catch (e) {
        // noop. `window` not available probably.
      }
    }

    refresh_token = refresh_token !== "" ? refresh_token : null;

    this.autoLogin(refresh_token);
  }

  private _removeParam(key, sourceURL) {
    var rtn = sourceURL.split("?")[0],
      param,
      params_arr = [],
      queryString =
        sourceURL.indexOf("?") !== -1 ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
      params_arr = queryString.split("&");
      for (var i = params_arr.length - 1; i >= 0; i -= 1) {
        param = params_arr[i].split("=")[0];
        if (param === key) {
          params_arr.splice(i, 1);
        }
      }
      if (params_arr.length > 0) {
        rtn = rtn + "?" + params_arr.join("&");
      }
    }
    return rtn;
  }

  private async setItem(key: string, value: string): Promise<void> {
    if (typeof value !== "string") {
      return console.error(`value is not of type "string"`);
    }

    switch (this.client_storage_type) {
      case "web":
        if (typeof this.client_storage.setItem !== "function") {
          console.error(`this.client_storage.setItem is not a function`);
          break;
        }
        this.client_storage.setItem(key, value);
        break;
      case "react-native":
        if (typeof this.client_storage.setItem !== "function") {
          console.error(`this.client_storage.setItem is not a function`);
          break;
        }
        await this.client_storage.setItem(key, value);
        break;
      case "capacitor":
        if (typeof this.client_storage.set !== "function") {
          console.error(`this.client_storage.set is not a function`);
          break;
        }
        await this.client_storage.set({ key, value });
        break;
      case "expo-secure-storage":
        if (typeof this.client_storage.setItemAsync !== "function") {
          console.error(`this.client_storage.setItemAsync is not a function`);
          break;
        }
        this.client_storage.setItemAsync(key, value);
        break;
      default:
        break;
    }
  }

  private async getItem(key: string): Promise<unknown> {
    switch (this.client_storage_type) {
      case "web":
        if (typeof this.client_storage.getItem !== "function") {
          console.error(`this.client_storage.getItem is not a function`);
          break;
        }
        return this.client_storage.getItem(key);
      case "react-native":
        if (typeof this.client_storage.getItem !== "function") {
          console.error(`this.client_storage.getItem is not a function`);
          break;
        }
        return await this.client_storage.getItem(key);
      case "capacitor":
        if (typeof this.client_storage.get !== "function") {
          console.error(`this.client_storage.get is not a function`);
          break;
        }
        const res = await this.client_storage.get({ key });
        return res.value;
      case "expo-secure-storage":
        if (typeof this.client_storage.getItemAsync !== "function") {
          console.error(`this.client_storage.getItemAsync is not a function`);
          break;
        }
        return this.client_storage.getItemAsync(key);
      default:
        break;
    }
  }

  private async removeItem(key: string): Promise<void> {
    switch (this.client_storage_type) {
      case "web":
        if (typeof this.client_storage.removeItem !== "function") {
          console.error(`this.client_storage.removeItem is not a function`);
          break;
        }
        return this.client_storage.removeItem(key);
      case "react-native":
        if (typeof this.client_storage.removeItem !== "function") {
          console.error(`this.client_storage.removeItem is not a function`);
          break;
        }
        return await this.client_storage.removeItem(key);
      case "capacitor":
        if (typeof this.client_storage.remove !== "function") {
          console.error(`this.client_storage.remove is not a function`);
          break;
        }
        await this.client_storage.remove({ key });
        break;
      case "expo-secure-storage":
        if (typeof this.client_storage.deleteItemAsync !== "function") {
          console.error(
            `this.client_storage.deleteItemAsync is not a function`
          );
          break;
        }
        this.client_storage.deleteItemAsync(key);
        break;
      default:
        break;
    }
  }

  private generateHeaders(): null | types.Headers {
    if (this.use_cookies) return null;

    const jwt_token = this.JWTMemory.getJWT();

    return {
      Authorization: `Bearer ${jwt_token}`,
    };
  }

  private autoLogin(refresh_token: string | null): void {
    if (this.ssr) {
      return this.setLoginState(null);
    }
    this.refreshToken(refresh_token);
  }

  private setLoginState(
    state: boolean,
    jwt_token: string = "",
    jwt_expires_in: number = 0
  ): void {
    // set new jwt_token
    if (jwt_token) {
      this.JWTMemory.setJWT(jwt_token);
    }

    // early exit
    if (this.login_state === state) return;

    // State has changed!

    // set new login_state
    this.login_state = state;

    if (this.login_state) {
      const refresh_interval_time =
        this.refresh_interval_time !== null ||
        typeof jwt_expires_in !== "number"
          ? this.refresh_interval_time
          : Math.max(30 * 1000, jwt_expires_in - 45000); //45 sec before expires

      // start refresh token interval
      this.refresh_interval = setInterval(
        this.refreshToken.bind(this),
        refresh_interval_time
      );
    } else {
      // stop refresh interval
      clearInterval(this.refresh_interval);
    }

    // call auth state change functions
    this.authStateChanged(this.login_state);
  }

  public async register(
    email: string,
    password: string,
    user_data?: any
  ): Promise<void> {
    try {
      await this.http_client.post("/register", {
        email,
        password,
        user_data,
      });
    } catch (error) {
      throw error;
    }
  }

  public async login(
    email: string,
    password: string
  ): Promise<types.LoginData> {
    let res;
    try {
      res = await this.http_client.post("/login", {
        email,
        password,
        cookie: this.use_cookies,
      });
    } catch (error) {
      this.removeItem("refresh_token");
      throw error;
    }

    if ("mfa" in res.data) {
      return res.data;
    }

    this.setLoginState(true, res.data.jwt_token, res.data.jwt_expires_in);

    // set refresh token
    if (!this.use_cookies) {
      await this.setItem("refresh_token", res.data.refresh_token);
    }

    return {};
  }

  public async logout(all: boolean = false): Promise<void> {
    try {
      await this.http_client.post(
        "/logout",
        {
          all,
        },
        {
          params: {
            refresh_token: await this.getItem("refresh_token"),
          },
        }
      );
    } catch (error) {
      // throw error;
      // noop
    }

    this.JWTMemory.clearJWT();
    this.removeItem("refresh_token");
    this.setLoginState(false);
  }

  public onTokenChanged(fn: Function): void {
    this.token_changed_functions.push(fn);
  }

  public onAuthStateChanged(fn: Function): void {
    this.auth_changed_functions.push(fn);

    // get index;
    const auth_changed_function_index = this.auth_changed_functions.length - 1;

    const unsubscribe = () => {
      try {
        // replace onAuthStateChanged with empty function
        this.auth_changed_functions[auth_changed_function_index] = () => {};
      } catch (err) {
        console.warn("Unable to unsubscribe. Maybe you already did?");
      }
    };

    return unsubscribe;
  }

  public isAuthenticated(): boolean | null {
    return this.login_state;
  }

  public getJWTToken(): string {
    return this.JWTMemory.getJWT();
  }

  public getClaim(claim: string): string {
    return this.JWTMemory.getClaim(claim);
  }

  private async refreshToken(init_refresh_token: string | null): Promise<void> {
    const refresh_token =
      init_refresh_token || (await this.getItem("refresh_token"));

    if (!refresh_token) {
      // palce at end of call-stack to let frontend get `null` first (to match SSR)
      setTimeout(() => this.setLoginState(false), 0);
      return;
    }

    let res;
    try {
      res = await this.http_client.get("/token/refresh", {
        params: {
          refresh_token,
        },
      });
    } catch (error) {
      // TODO: if error was 401 Unauthorized => clear refresh token locally.
      return this.setLoginState(false);
    }

    // set refresh token
    if (!this.use_cookies) {
      await this.setItem("refresh_token", res.data.refresh_token);
    }

    this.setLoginState(true, res.data.jwt_token, res.data.jwt_expires_in);
    this.tokenChanged();
  }

  private tokenChanged(): void {
    for (const tokenChangedFunction of this.token_changed_functions) {
      tokenChangedFunction();
    }
  }

  private authStateChanged(state: boolean): void {
    for (const authChangedFunction of this.auth_changed_functions) {
      authChangedFunction(state);
    }
  }

  public async activate(ticket: string): Promise<void> {
    await this.http_client.get(`/activate?ticket=${ticket}`);
  }

  public async changeEmail(new_email: string): Promise<void> {
    await this.http_client.post(
      "/change-email",
      {
        new_email,
      },
      {
        headers: this.generateHeaders(),
      }
    );
  }

  public async changeEmailRequest(new_email: string): Promise<void> {
    await this.http_client.post(
      "/change-email/request",
      {
        new_email,
      },
      {
        headers: this.generateHeaders(),
      }
    );
  }

  public async changeEmailChange(ticket: string): Promise<void> {
    await this.http_client.post("/change-email/change", {
      ticket,
    });
  }

  public async changePassword(
    old_password: string,
    new_password: string
  ): Promise<void> {
    await this.http_client.post(
      "/change-password",
      {
        old_password,
        new_password,
      },
      {
        headers: this.generateHeaders(),
      }
    );
  }

  public async changePasswordRequest(email: string): Promise<void> {
    await this.http_client.post("/change-password/request", {
      email,
    });
  }

  public async changePasswordChange(
    new_password: string,
    ticket: string
  ): Promise<void> {
    await this.http_client.post("/change-password/change", {
      new_password,
      ticket,
    });
  }

  public async MFAGenerate(): Promise<void> {
    const res = await this.http_client.post(
      "/mfa/generate",
      {},
      {
        headers: this.generateHeaders(),
      }
    );
    return res.data;
  }

  public async MFAEnable(code: string): Promise<void> {
    await this.http_client.post(
      "/mfa/enable",
      {
        code,
      },
      {
        headers: this.generateHeaders(),
      }
    );
  }

  public async MFADisable(code: string): Promise<void> {
    await this.http_client.post(
      "/mfa/disable",
      {
        code,
      },
      {
        headers: this.generateHeaders(),
      }
    );
  }

  public async MFATotp(code: string, ticket: string): Promise<void> {
    const res = await this.http_client.post("/mfa/totp", {
      code,
      ticket,
    });

    // set refresh token
    if (!this.use_cookies) {
      await this.setItem("refresh_token", res.data.refresh_token);
    }

    this.setLoginState(true, res.data.jwt_token, res.data.jwt_expires_in);
  }
}
