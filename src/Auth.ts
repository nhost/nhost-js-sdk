import axios, { AxiosInstance } from "axios";
import * as types from "./types";
import JWTMemory from "./JWTMemory";

export default class Auth {
  private http_client: AxiosInstance;
  private auth_changed_functions: Function[];
  private login_state: boolean | null;
  private refresh_interval: any;
  private refresh_interval_time: number;
  private JWTMemory: JWTMemory;

  constructor(config: types.Config, JWTMemory: JWTMemory) {
    this.http_client = axios.create({
      baseURL: `${config.base_url}/auth`,
      timeout: 10000,
      withCredentials: true,
    });

    this.login_state = null;
    this.auth_changed_functions = [];
    this.refresh_interval;
    this.JWTMemory = JWTMemory;

    this.autoLogin();
  }

  private autoLogin() {
    this.refreshToken();
  }

  private setLoginState(state: boolean, jwt_token: string = ""): void {
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
      // start refresh token interval
      this.refresh_interval = setInterval(this.refreshToken.bind(this), 30000);
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
    register_data?: any
  ): Promise<void> {
    try {
      await this.http_client.post("/register", {
        email,
        password,
        // user_data: register_data,
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
      });
    } catch (error) {
      throw error;
    }

    if ("mfa" in res.data) {
      return res.data;
    }

    this.setLoginState(true, res.data.jwt_token);

    return {};
  }

  public async logout(all: boolean = false): Promise<void> {
    try {
      await this.http_client.post("/logout", {
        all,
      });
    } catch (error) {
      throw error;
    }

    this.JWTMemory.clearJWT();
    this.setLoginState(false);
  }

  public onAuthStateChanged(fn: Function): void {
    this.auth_changed_functions.push(fn);
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

  private async refreshToken(): Promise<void> {
    let res;
    try {
      res = await this.http_client.get("/token/refresh");
    } catch (error) {
      return this.setLoginState(false);
    }
    this.setLoginState(true, res.data.jwt_token);
  }

  private authStateChanged(state: boolean): void {
    for (const authChangedFunction of this.auth_changed_functions) {
      authChangedFunction(state);
    }
  }

  public async activate(ticket: string): Promise<void> {
    await this.http_client.post("/activate", {
      ticket,
    });
  }

  public async changeEmail(new_email: string): Promise<void> {
    await this.http_client.post("/change-email", {
      new_email,
    });
  }

  public async changeEmailRequest(new_email: string): Promise<void> {
    await this.http_client.post("/change-email/request", {
      new_email,
    });
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
    await this.http_client.post("/change-password", {
      old_password,
      new_password,
    });
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
    const res = await this.http_client.post("/mfa/generate");
    return res.data;
  }

  public async MFAEnable(code: string): Promise<void> {
    await this.http_client.post("/mfa/enable", {
      code,
    });
  }

  public async MFADisable(code: string): Promise<void> {
    await this.http_client.post("/mfa/disable", {
      code,
    });
  }

  public async MFATotp(code: string, ticket: string): Promise<void> {
    const res = await this.http_client.post("/mfa/totp", {
      code,
      ticket,
    });
    this.setLoginState(true, res.data.jwt_token);
  }
}
