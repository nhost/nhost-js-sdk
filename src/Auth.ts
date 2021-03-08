import axios, { AxiosInstance } from "axios";
import queryString from "query-string";
import * as types from "./types";
import UserSession from "./UserSession";

export type AuthChangedFunction = (isAuthenticated: boolean) => void;

export default class Auth {
  private httpClient: AxiosInstance;
  private tokenChangedFunctions: Function[];
  private authChangedFunctions: AuthChangedFunction[];

  private refreshInterval: any;
  private useCookies: boolean;
  private refreshIntervalTime: number | null;
  private clientStorage: types.ClientStorage;
  private clientStorageType: string;

  private ssr: boolean | undefined;
  private refreshTokenLock: boolean;
  private baseURL: string;
  private currentUser: types.User | null;
  private currentSession: UserSession;
  private loading: boolean;
  private refreshSleepCheckInterval: any;
  private refreshIntervalSleepCheckLastSample: number;
  private sampleRate: number;

  constructor(config: types.AuthConfig, session: UserSession) {
    const {
      baseURL,
      useCookies,
      refreshIntervalTime,
      clientStorage,
      clientStorageType,
      ssr,
      autoLogin,
    } = config;

    this.useCookies = useCookies;
    this.refreshIntervalTime = refreshIntervalTime;
    this.clientStorage = clientStorage;
    this.clientStorageType = clientStorageType;
    this.tokenChangedFunctions = [];
    this.authChangedFunctions = [];
    this.refreshInterval;

    this.refreshSleepCheckInterval = 0;
    this.refreshIntervalSleepCheckLastSample = Date.now();
    this.sampleRate = 2000; // check every 2 seconds
    this.ssr = ssr;

    this.refreshTokenLock = false;
    this.baseURL = baseURL;
    this.loading = true;

    this.currentUser = null;
    this.currentSession = session;

    this.httpClient = axios.create({
      baseURL: `${this.baseURL}/auth`,
      timeout: 10000,
      withCredentials: this.useCookies,
    });

    // get refresh token from query param (from external OAuth provider callback)
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

    // if empty string, then set it to null
    refreshToken = refreshToken ? refreshToken : null;

    if (autoLogin) {
      this._autoLogin(refreshToken);
    } else if (refreshToken) {
      this._setItem("nhostRefreshToken", refreshToken);
    }
  }

  public user(): types.User | null {
    return this.currentUser;
  }

  public async register({
    email,
    password,
    options = {},
  }: types.UserCredentials): Promise<{
    session: types.Session | null;
    user: types.User;
  }> {
    const { userData, defaultRole, allowedRoles } = options;

    const registerOptions =
      defaultRole || allowedRoles
        ? {
            default_role: defaultRole,
            allowed_roles: allowedRoles,
          }
        : undefined;

    let res;
    try {
      res = await this.httpClient.post("/register", {
        email,
        password,
        cookie: this.useCookies,
        user_data: userData,
        register_options: registerOptions,
      });
    } catch (error) {
      throw error;
    }

    if (res.data.jwt_token) {
      this._setSession(res.data);

      return { session: res.data, user: res.data.user };
    } else {
      // if AUTO_ACTIVATE_NEW_USERS is false
      return { session: null, user: res.data.user };
    }
  }

  public async login({
    email,
    password,
    provider,
  }: types.UserCredentials): Promise<{
    session: types.Session | null;
    user: types.User | null;
    mfa?: {
      ticket: string;
    };
  }> {
    if (provider) {
      window.location.href = `${this.baseURL}/auth/providers/${provider}`;
      return { session: null, user: null };
    }

    let res;
    try {
      res = await this.httpClient.post("/login", {
        email,
        password,
        cookie: this.useCookies,
      });
    } catch (error) {
      this._clearSession();
      throw error;
    }

    if ("mfa" in res.data) {
      return { session: null, user: null, mfa: { ticket: res.data.ticket } };
    }

    this._setSession(res.data);

    return { session: res.data, user: res.data.user };
  }

  public async logout(
    all: boolean = false
  ): Promise<{
    session: null;
    user: null;
  }> {
    try {
      await this.httpClient.post(
        "/logout",
        {
          all,
        },
        {
          params: {
            refresh_token: await this._getItem("nhostRefreshToken"),
          },
        }
      );
    } catch (error) {
      // throw error;
      // noop
    }

    this._clearSession();

    return { session: null, user: null };
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

  public onAuthStateChanged(fn: AuthChangedFunction): Function {
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
    if (this.loading) return null;
    return this.currentSession.getSession() !== null;
  }

  public isAuthenticatedAsync(): Promise<boolean> {
    const isAuthenticated = this.isAuthenticated();

    return new Promise(resolve => {
      if(isAuthenticated !== null) resolve(isAuthenticated);
      else {
        const unsubscribe = this.onAuthStateChanged((isAuthenticated) => {
          resolve(isAuthenticated);
          unsubscribe();
        })
      }
    })
  }

  public getJWTToken(): string | null {
    return this.currentSession.getSession()?.jwt_token || null;
  }

  public getClaim(claim: string): string | string[] | null {
    return this.currentSession.getClaim(claim);
  }

  public async refreshSession(): Promise<void> {
    return await this._refreshToken();
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
        headers: this._generateHeaders(),
      }
    );
  }

  public async requestEmailChange(new_email: string): Promise<void> {
    await this.httpClient.post(
      "/change-email/request",
      {
        new_email,
      },
      {
        headers: this._generateHeaders(),
      }
    );
  }

  public async confirmEmailChange(ticket: string): Promise<void> {
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
        headers: this._generateHeaders(),
      }
    );
  }

  public async requestPasswordChange(email: string): Promise<void> {
    await this.httpClient.post("/change-password/request", {
      email,
    });
  }

  public async confirmPasswordChange(
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
        headers: this._generateHeaders(),
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
        headers: this._generateHeaders(),
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
        headers: this._generateHeaders(),
      }
    );
  }

  public async MFATotp(
    code: string,
    ticket: string
  ): Promise<{
    session: types.Session;
    user: types.User;
  }> {
    const res = await this.httpClient.post("/mfa/totp", {
      code,
      ticket,
      cookie: this.useCookies,
    });

    this._setSession(res.data);

    return { session: res.data, user: res.data.user };
  }

  private _removeParam(key: string, sourceURL: string) {
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

  private async _setItem(key: string, value: string): Promise<void> {
    if (typeof value !== "string") {
      console.error(`value is not of type "string"`);
      return;
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

  private async _getItem(key: string): Promise<unknown> {
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

  private async _removeItem(key: string): Promise<void> {
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

  private _generateHeaders(): null | types.Headers {
    if (this.useCookies) return null;

    return {
      Authorization: `Bearer ${this.currentSession.getSession()?.jwt_token}`,
    };
  }

  private _autoLogin(refreshToken: string | null): void {
    if (this.ssr) {
      return;
    }

    this._refreshToken(refreshToken);
  }

  private async _refreshToken(initRefreshToken?: string | null): Promise<void> {
    const refreshToken =
      initRefreshToken || (await this._getItem("nhostRefreshToken"));

    if (!refreshToken) {
      // place at end of call-stack to let frontend get `null` first (to match SSR)
      setTimeout(() => {
        this._clearSession();
      }, 0);

      return;
    }

    let res;
    try {
      // set lock to avoid two refresh token request being sent at the same time with the same token.
      // If so, the last request will fail because the first request used the refresh token
      if (this.refreshTokenLock) {
        return console.debug(
          "refresh token already in transit. Halting this request."
        );
      }
      this.refreshTokenLock = true;

      // make refresh token request
      res = await this.httpClient.get("/token/refresh", {
        params: {
          refresh_token: refreshToken,
        },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        await this.logout();
        return;
      } else {
        return; // silent fail
      }
    } finally {
      // release lock
      this.refreshTokenLock = false;
    }

    this._setSession(res.data);
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

  private async _clearSession(): Promise<void> {
    // early exit
    if (this.isAuthenticated() === false) {
      return;
    }

    clearInterval(this.refreshInterval);
    clearInterval(this.refreshSleepCheckInterval);

    this.currentSession.clearSession();
    this._removeItem("nhostRefreshToken");

    this.loading = false;
    this.authStateChanged(false);
  }

  private async _setSession(session: types.Session) {
    const previouslyAuthenticated = this.isAuthenticated();
    this.currentSession.setSession(session);
    this.currentUser = session.user;

    if (!this.useCookies && session.refresh_token) {
      await this._setItem("nhostRefreshToken", session.refresh_token);
    }

    const JWTExpiresIn = session.jwt_expires_in;
    const refreshIntervalTime = this.refreshIntervalTime
      ? this.refreshIntervalTime
      : Math.max(30 * 1000, JWTExpiresIn - 45000); //45 sec before expires

    // start refresh token interval after logging in
    this.refreshInterval = setInterval(
      this._refreshToken.bind(this),
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
        this._refreshToken();
      }
      this.refreshIntervalSleepCheckLastSample = Date.now();
    }, this.sampleRate);

    this.loading = false;

    if (!previouslyAuthenticated) {
      this.authStateChanged(true);
    }
  }
}
