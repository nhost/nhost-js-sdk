import axios, { AxiosInstance } from "axios";
import * as types from "./types";
import JWTMemory from "./JWTMemory";

export default class Storage {
  private http_client: AxiosInstance;
  private JWTMemory: JWTMemory;
  private use_cookies: boolean;

  constructor(config: types.StorageConfig, JWTMemory: JWTMemory) {
    this.JWTMemory = JWTMemory;
    this.use_cookies = config.use_cookies;

    this.http_client = axios.create({
      baseURL: config.base_url,
      timeout: 120 * 1000, // milliseconds
      withCredentials: this.use_cookies,
    });
  }

  private generateAuthorizationHeader(): null | types.Headers {
    if (this.use_cookies) return null;

    const jwt_token = this.JWTMemory.getJWT();

    return {
      Authorization: `Bearer ${jwt_token}`,
    };
  }

  async put(
    path: string,
    file: File,
    metadata: object | null = null,
    onUploadProgress: any | undefined = undefined
  ) {
    let form_data = new FormData();
    form_data.append("file", file);

    // todo: handle metadata
    if (metadata !== null) {
      console.warn("Metadata is not yet handled in this NHOST JS SDK.");
    }

    const upload_res = await this.http_client.post(
      `/storage/o${path}`,
      form_data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...this.generateAuthorizationHeader(),
        },
        onUploadProgress,
      }
    );

    return upload_res.data;
  }

  async delete(path: string) {
    const upload_res = await this.http_client.delete(`storage/o${path}`, {
      headers: {
        ...this.generateAuthorizationHeader(),
      },
    });
    return upload_res.data;
  }

  async getMetadata(path: string): Promise<object> {
    const res = await this.http_client.get(`storage/m${path}`, {
      headers: {
        ...this.generateAuthorizationHeader(),
      },
    });
    return res.data;
  }
}
