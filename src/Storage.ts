import axios, { AxiosInstance } from "axios";
import * as types from "./types";
import JWTMemory from "./JWTMemory";
import {
  StringFormat,
  base64Bytes,
  utf8Bytes,
  percentEncodedBytes,
} from "./utils";
import Blob from "node-blob";

export default class Storage {
  private httpClient: AxiosInstance;
  private JWTMemory: JWTMemory;
  private useCookies: boolean;

  constructor(config: types.StorageConfig, JWTMemory: JWTMemory) {
    this.JWTMemory = JWTMemory;
    this.useCookies = config.useCookies;

    this.httpClient = axios.create({
      baseURL: config.baseURL,
      timeout: 120 * 1000, // milliseconds
      withCredentials: this.useCookies,
    });
  }

  private generateAuthorizationHeader(): null | types.Headers {
    if (this.useCookies) return null;

    const JWTToken = this.JWTMemory.getJWT();

    if (JWTToken) {
      return {
        Authorization: `Bearer ${JWTToken}`,
      };
    } else {
      return null;
    }
  }

  async put(
    path: string,
    file: File,
    metadata: object | null = null,
    onUploadProgress: any | undefined = undefined
  ) {
    let formData = new FormData();
    formData.append("file", file);

    // todo: handle metadata
    if (metadata !== null) {
      console.warn("Metadata is not yet handled in this NHOST JS SDK.");
    }

    const upload_res = await this.httpClient.post(
      `/storage/o${path}`,
      formData,
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

  async putString(
    path: string,
    data: string,
    type: StringFormat = "raw",
    metadata: object | null = null,
    onUploadProgress: any | undefined = undefined
  ) {
    // todo: handle metadata
    // if (metadata !== null) {
    //   console.warn("Metadata is not yet handled in this NHOST JS SDK.");
    // }

    let blob;
    if (type === "raw") {
      const fileData = utf8Bytes(data);
      const contentType =
        metadata && metadata.hasOwnProperty("content-type")
          ? metadata["content-type"]
          : null;
      blob = new Blob([fileData], { type: contentType });
    } else if (type === "data_url") {
      let isBase64 = false;
      let contentType: string | undefined = undefined;

      const matches = data.match(/^data:([^,]+)?,/);
      if (matches === null) {
        throw "Data must be formatted 'data:[<mediatype>][;base64],<data>";
      }

      const middle = matches[1] || null;
      if (middle != null) {
        isBase64 = middle.endsWith(";base64");
        contentType = isBase64
          ? middle.substring(0, middle.length - ";base64".length)
          : middle;
      }

      const restData = data.substring(data.indexOf(",") + 1);

      const fileData = isBase64
        ? base64Bytes(StringFormat.BASE64, restData)
        : percentEncodedBytes(restData);

      blob = new Blob([fileData], { type: contentType });
    }

    // create fil from message
    var file = new File([blob], "sample.JPG", { type: "image/png" });

    console.log({ file });

    // create form data
    let form_data = new FormData();
    form_data.append("file", file);

    const uploadRes = await this.httpClient.post(
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

    return uploadRes.data;
  }

  async delete(path: string) {
    const requestRes = await this.httpClient.delete(`storage/o${path}`, {
      headers: {
        ...this.generateAuthorizationHeader(),
      },
    });
    return requestRes.data;
  }

  async getMetadata(path: string): Promise<object> {
    const res = await this.httpClient.get(`storage/m${path}`, {
      headers: {
        ...this.generateAuthorizationHeader(),
      },
    });
    return res.data;
  }
}
