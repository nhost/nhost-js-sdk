import axios, { AxiosInstance } from "axios";
import * as types from "./types";
import JWTMemory from "./JWTMemory";

export default class Auth {
  private http_client: AxiosInstance;
  private auth_changed_functions: Function[];
  private login_state: boolean | null;
  private refresh_interval: number;
  private JWTMemory: JWTMemory;

  constructor(config: types.Config, JWTMemory: JWTMemory) {
    this.http_client = axios.create({
      baseURL: config.base_url,
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
      this.refresh_interval = setInterval(this.refreshToken.bind(this), 10000);
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
    register_data: any
  ): Promise<void> {
    try {
      await this.http_client.post("/auth/register", {
        email,
        password,
        // user_data: register_data,
      });
    } catch (error) {
      throw error;
    }
  }

  public async login(email: string, password: string): Promise<void> {
    let login_res;
    try {
      login_res = await this.http_client.post("/auth/login", {
        email,
        password,
      });
    } catch (error) {
      throw error;
    }
    this.setLoginState(true, login_res.data.jwt_token);
  }

  public async logout(all: boolean = false): Promise<void> {
    try {
      await this.http_client.post("/auth/logout", {
        all,
      });
    } catch (error) {
      throw error;
    }

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
      res = await this.http_client.get("/auth/token/refresh");
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
}
