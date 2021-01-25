// @ts-nocheck
import axios, { AxiosInstance } from "axios";
import queryString from "query-string";
import * as types from "./types";
import JWTMemory from "./JWTMemory";

export default class Auth {
  private httpClient: AxiosInstance;
  private tokenChangedFunctions: Function[];
  private authChangedFunctions: Function[];
  private loginState: boolean | null;
  private refreshInterval: any;
  private useCookies: boolean;
  private refreshIntervalTime: number | null;
  private clientStorage: types.ClientStorage;
  private clientStorageType: string;
  private JWTMemory: JWTMemory;
  private ssr: boolean;

  constructor(config: types.AuthConfig, JWTMemory: JWTMemory) {
    const {
      baseURL,
      useCookies,
      refreshIntervalTime,
      clientStorage,
      clientStorageType,
      ssr,
    } = config;

    this.useCookies = useCookies;
    this.refreshIntervalTime = refreshIntervalTime;
    this.clientStorage = clientStorage;
    this.clientStorageType = clientStorageType;
    this.loginState = null;
    this.tokenChangedFunctions = [];
    this.authChangedFunctions = [];
    this.refreshInterval;
    this.refreshSleepCheckInterval;
    this.refreshIntervalSleepCheckLastSample;
    this.sampleRate = 2000; // check every 2 seconds
    this.JWTMemory = JWTMemory;
    this.ssr = ssr;

    this.httpClient = axios.create({
      baseURL: `${baseURL}/auth`,
      timeout: 10000,
      withCredentials: this.useCookies,
    });

    // get refresh token from query param (from externa OAuth provider callback)
    let refreshToken: string | null = null;

    if (!ssr) {
      try {
        const parsed = queryString.parse(window.location.search);
        refreshToken =
          "refresh_token" in parsed ? (parsed.refresh_token as string) : null;

        if (refreshToken) {
          let newURL = this._removeParam("refresh_token", window.location.href);
          try {
            window.history.pushState({}, document.title, newURL);
          } catch {
            // noop
            // window object not available
          }
        }
      } catch (e) {
        // noop. `window` not available probably.
      }
    }

    refreshToken = refreshToken !== "" ? refreshToken : null;

    this.autoLogin(refreshToken);
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

    switch (this.clientStorageType) {
      case "web":
        if (typeof this.clientStorage.setItem !== "function") {
          console.error(`this.clientStorage.setItem is not a function`);
          break;
        }
        this.clientStorage.setItem(key, value);
        break;
      case "react-native":
        if (typeof this.clientStorage.setItem !== "function") {
          console.error(`this.clientStorage.setItem is not a function`);
          break;
        }
        await this.clientStorage.setItem(key, value);
        break;
      case "capacitor":
        if (typeof this.clientStorage.set !== "function") {
          console.error(`this.clientStorage.set is not a function`);
          break;
        }
        await this.clientStorage.set({ key, value });
        break;
      case "expo-secure-storage":
        if (typeof this.clientStorage.setItemAsync !== "function") {
          console.error(`this.clientStorage.setItemAsync is not a function`);
          break;
        }
        this.clientStorage.setItemAsync(key, value);
        break;
      default:
        break;
    }
  }

  private async getItem(key: string): Promise<unknown> {
    switch (this.clientStorageType) {
      case "web":
        if (typeof this.clientStorage.getItem !== "function") {
          console.error(`this.clientStorage.getItem is not a function`);
          break;
        }
        return this.clientStorage.getItem(key);
      case "react-native":
        if (typeof this.clientStorage.getItem !== "function") {
          console.error(`this.clientStorage.getItem is not a function`);
          break;
        }
        return await this.clientStorage.getItem(key);
      case "capacitor":
        if (typeof this.clientStorage.get !== "function") {
          console.error(`this.clientStorage.get is not a function`);
          break;
        }
        const res = await this.clientStorage.get({ key });
        return res.value;
      case "expo-secure-storage":
        if (typeof this.clientStorage.getItemAsync !== "function") {
          console.error(`this.clientStorage.getItemAsync is not a function`);
          break;
        }
        return this.clientStorage.getItemAsync(key);
      default:
        break;
    }
  }

  private async removeItem(key: string): Promise<void> {
    switch (this.clientStorageType) {
      case "web":
        if (typeof this.clientStorage.removeItem !== "function") {
          console.error(`this.clientStorage.removeItem is not a function`);
          break;
        }
        return this.clientStorage.removeItem(key);
      case "react-native":
        if (typeof this.clientStorage.removeItem !== "function") {
          console.error(`this.clientStorage.removeItem is not a function`);
          break;
        }
        return await this.clientStorage.removeItem(key);
      case "capacitor":
        if (typeof this.clientStorage.remove !== "function") {
          console.error(`this.clientStorage.remove is not a function`);
          break;
        }
        await this.clientStorage.remove({ key });
        break;
      case "expo-secure-storage":
        if (typeof this.clientStorage.deleteItemAsync !== "function") {
          console.error(`this.clientStorage.deleteItemAsync is not a function`);
          break;
        }
        this.clientStorage.deleteItemAsync(key);
        break;
      default:
        break;
    }
  }

  private generateHeaders(): null | types.Headers {
    if (this.useCookies) return null;

    const jwt_token = this.JWTMemory.getJWT();

    return {
      Authorization: `Bearer ${jwt_token}`,
    };
  }

  private autoLogin(refreshToken: string | null): void {
    if (this.ssr) {
      return this.setLoginState(null);
    }
    this.refreshToken(refreshToken);
  }

  private setLoginState(
    state: boolean,
    JWTToken: string = "",
    JWTExpiresIn: number = 0
  ): void {
    // set new JWTToken
    if (JWTToken) {
      this.JWTMemory.setJWT(JWTToken);
    }

    // early exit
    if (this.loginState === state) return;

    // State has changed!

    // set new loginState
    this.loginState = state;

    if (this.loginState) {
      const refreshIntervalTime =
        this.refreshIntervalTime !== null || typeof JWTExpiresIn !== "number"
          ? this.refreshIntervalTime
          : Math.max(30 * 1000, JWTExpiresIn - 45000); //45 sec before expires

      // start refresh token interval after logging in
      this.refreshInterval = setInterval(
        this.refreshToken.bind(this),
        refreshIntervalTime
      );

      // refresh token after computer has been sleeping
      // https://stackoverflow.com/questions/14112708/start-calling-js-function-when-pc-wakeup-from-sleep-mode
      this.refreshIntervalSleepCheckLastSample = Date.now();
      this.refreshSleepCheckInterval = setInterval(() => {
        if (
          Date.now() - this.refreshIntervalSleepCheckLastSample >=
          this.sampleRate * 2
        ) {
          this.refreshToken();
        }
        this.refreshIntervalSleepCheckLastSample = Date.now();
      }, this.sampleRate);
    } else {
      // stop refresh interval
      clearInterval(this.refreshInterval);
      clearInterval(this.refreshSleepCheckInterval);
    }

    // call auth state change functions
    this.authStateChanged(this.loginState);
  }

  public async register(
    email: string,
    password: string,
    registrationOptions: {
      userData?: any;
      defaultRole?: string;
      allowedRoles?: string[];
    } = {}
  ): Promise<void> {
    const { userData, defaultRole, allowedRoles } = registrationOptions;

    const registerOptions =
      defaultRole || allowedRoles
        ? {
            default_role: defaultRole,
            allowed_roles: allowedRoles,
          }
        : undefined;

    try {
      await this.httpClient.post("/register", {
        email,
        password,
        user_data: userData,
        register_options: registerOptions,
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
      res = await this.httpClient.post("/login", {
        email,
        password,
        cookie: this.useCookies,
      });
    } catch (error) {
      this.removeItem("nhostRefreshToken");
      throw error;
    }

    if ("mfa" in res.data) {
      return res.data;
    }

    this.setLoginState(true, res.data.jwt_token, res.data.jwt_expires_in);

    // set refresh token
    if (!this.useCookies) {
      await this.setItem("nhostRefreshToken", res.data.refresh_token);
    }

    return {};
  }

  public async logout(all: boolean = false): Promise<void> {
    try {
      await this.httpClient.post(
        "/logout",
        {
          all,
        },
        {
          params: {
            refresh_token: await this.getItem("nhostRefreshToken"),
          },
        }
      );
    } catch (error) {
      // throw error;
      // noop
    }

    this.JWTMemory.clearJWT();
    this.removeItem("nhostRefreshToken");
    this.setLoginState(false);
  }

  public onTokenChanged(fn: Function): Function {
    this.tokenChangedFunctions.push(fn);

    // get index;
    const tokenChangedFunctionIndex = this.authChangedFunctions.length - 1;

    const unsubscribe = () => {
      try {
        // replace onTokenChanged with empty function
        this.authChangedFunctions[tokenChangedFunctionIndex] = () => {};
      } catch (err) {
        console.warn(
          "Unable to unsubscribe onTokenChanged function. Maybe you already did?"
        );
      }
    };

    return unsubscribe;
  }

  public onAuthStateChanged(fn: Function): Function {
    this.authChangedFunctions.push(fn);

    // get index;
    const authStateChangedFunctionIndex = this.authChangedFunctions.length - 1;

    const unsubscribe = () => {
      try {
        // replace onAuthStateChanged with empty function
        this.authChangedFunctions[authStateChangedFunctionIndex] = () => {};
      } catch (err) {
        console.warn(
          "Unable to unsubscribe onAuthStateChanged function. Maybe you already did?"
        );
      }
    };

    return unsubscribe;
  }

  public isAuthenticated(): boolean | null {
    return this.loginState;
  }

  public getJWTToken(): string {
    return this.JWTMemory.getJWT();
  }

  public getClaim(claim: string): string | string[] {
    return this.JWTMemory.getClaim(claim);
  }

  private async refreshToken(initRefreshToken: string | null): Promise<void> {
    const refreshToken =
      initRefreshToken || (await this.getItem("nhostRefreshToken"));

    if (!refreshToken) {
      // palce at end of call-stack to let frontend get `null` first (to match SSR)
      setTimeout(() => this.setLoginState(false), 0);
      return;
    }

    let res;
    try {
      res = await this.httpClient.get("/token/refresh", {
        params: {
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      // TODO: if error was 401 Unauthorized => clear refresh token locally.
      if (error.response?.status === 401) {
        return await this.logout();
      } else {
        // silent fail
        return;
      }
    }

    // set refresh token
    if (!this.useCookies) {
      await this.setItem("nhostRefreshToken", res.data.refresh_token);
    }

    this.setLoginState(true, res.data.jwt_token, res.data.jwt_expires_in);
    this.tokenChanged();
  }

  private tokenChanged(): void {
    for (const tokenChangedFunction of this.tokenChangedFunctions) {
      tokenChangedFunction();
    }
  }

  private authStateChanged(state: boolean): void {
    for (const authChangedFunction of this.authChangedFunctions) {
      authChangedFunction(state);
    }
  }

  public async activate(ticket: string): Promise<void> {
    await this.httpClient.get(`/activate?ticket=${ticket}`);
  }

  public async changeEmail(new_email: string): Promise<void> {
    await this.httpClient.post(
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
    await this.httpClient.post(
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
    await this.httpClient.post("/change-email/change", {
      ticket,
    });
  }

  public async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    await this.httpClient.post(
      "/change-password",
      {
        old_password: oldPassword,
        new_password: newPassword,
      },
      {
        headers: this.generateHeaders(),
      }
    );
  }

  public async changePasswordRequest(email: string): Promise<void> {
    await this.httpClient.post("/change-password/request", {
      email,
    });
  }

  public async changePasswordChange(
    newPassword: string,
    ticket: string
  ): Promise<void> {
    await this.httpClient.post("/change-password/change", {
      new_password: newPassword,
      ticket,
    });
  }

  public async MFAGenerate(): Promise<void> {
    const res = await this.httpClient.post(
      "/mfa/generate",
      {},
      {
        headers: this.generateHeaders(),
      }
    );
    return res.data;
  }

  public async MFAEnable(code: string): Promise<void> {
    await this.httpClient.post(
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
    await this.httpClient.post(
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
    const res = await this.httpClient.post("/mfa/totp", {
      code,
      ticket,
      cookie: this.useCookies,
    });

    this.setLoginState(true, res.data.jwt_token, res.data.jwt_expires_in);

    // set refresh token
    if (!this.useCookies) {
      await this.setItem("nhostRefreshToken", res.data.refresh_token);
    }
  }
}
