import axios, { AxiosInstance } from "axios";
import * as types from "./types";

export default class Auth {
  private http_client: AxiosInstance;

  constructor(config: types.Config) {
    this.http_client = axios.create({
      baseURL: config.base_url,
      timeout: 1000,
      withCredentials: true,
    });

    this.autoLogin();
  }

  private autoLogin() {
    console.log("auto login");

    this.refreshToken();
  }

  private async refreshToken() {
    try {
      const res = await this.http_client.get("/auth/token/refresh");
      console.log("res from refresh token");

      console.log(res);
    } catch (error) {
      console.log("could not get new refresh token");
    }
  }
}
