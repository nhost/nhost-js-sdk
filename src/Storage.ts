import axios, { AxiosInstance } from "axios";
import * as types from "./types";
import JWTMemory from "./JWTMemory";

export default class Storage {
  private http_client: AxiosInstance;
  private JWTMemory: JWTMemory;

  constructor(config: types.StorageConfig, JWTMemory: JWTMemory) {
    this.http_client = axios.create({
      baseURL: config.base_url,
      timeout: 120 * 1000, // milliseconds
      withCredentials: true,
    });

    this.JWTMemory = JWTMemory;
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
      console.warn("Metadata is not yet handled.");
    }

    const headers = {
      "Content-Type": "multipart/form-data",
    };

    const upload_res = await this.http_client.post(
      `/storage/o${path}`,
      form_data,
      {
        headers,
        onUploadProgress,
      }
    );

    return upload_res.data;
  }

  async delete(path: string) {
    const upload_res = await this.http_client.delete(`storage/o${path}`);
    return upload_res.data;
  }

  async getMetadata(path: string): Promise<object> {
    const res = await this.http_client.get(`storage/m${path}`);
    return res.data;
  }
}
