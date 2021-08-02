import axios, { AxiosInstance } from 'axios';
import * as types from './types';
import UserSession from './UserSession';
import {
  StringFormat,
  base64Bytes,
  utf8Bytes,
  percentEncodedBytes,
} from './utils';

export default class Storage {
  private httpClient: AxiosInstance;
  private useCookies: boolean;
  private currentSession: UserSession;

  constructor(config: types.StorageConfig, session: UserSession) {
    this.currentSession = session;
    this.useCookies = config.useCookies;

    this.httpClient = axios.create({
      baseURL: config.baseURL,
      timeout: 120 * 1000, // milliseconds
      withCredentials: this.useCookies,
    });
  }

  private generateAuthorizationHeader(): null | types.Headers {
    if (this.useCookies) return null;

    const JWTToken = this.currentSession.getSession()?.jwt_token;

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
    if (!path.startsWith('/')) {
      throw new Error('`path` must start with `/`');
    }

    let formData = new FormData();
    formData.append('file', file);

    // todo: handle metadata
    if (metadata !== null) {
      console.warn('Metadata is not yet handled in this version.');
    }

    const upload_res = await this.httpClient.post(
      `/storage/o${path}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
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
    type: 'raw' | 'data_url' = 'raw',
    metadata: { 'content-type': string } | null = null,
    onUploadProgress: any | undefined = undefined
  ) {
    if (!path.startsWith('/')) {
      throw new Error('`path` must start with `/`');
    }

    let fileData;
    let contentType: string | undefined;
    if (type === 'raw') {
      fileData = utf8Bytes(data);
      contentType =
        metadata && metadata.hasOwnProperty('content-type')
          ? metadata['content-type']
          : undefined;
    } else if (type === 'data_url') {
      let isBase64 = false;
      const matches = data.match(/^data:([^,]+)?,/);
      if (matches === null) {
        throw "Data must be formatted 'data:[<mediatype>][;base64],<data>";
      }
      const middle = matches[1] || null;
      if (middle != null) {
        isBase64 = middle.endsWith(';base64');
        contentType = isBase64
          ? middle.substring(0, middle.length - ';base64'.length)
          : middle;
      }
      const restData = data.substring(data.indexOf(',') + 1);
      fileData = isBase64
        ? base64Bytes(StringFormat.BASE64, restData)
        : percentEncodedBytes(restData);
    }

    if (!fileData) {
      throw new Error('Unbale to generate file data');
    }

    const file = new File([fileData], 'untitled', { type: contentType });

    // create form data
    let form_data = new FormData();
    form_data.append('file', file);

    const uploadRes = await this.httpClient.post(
      `/storage/o${path}`,
      form_data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...this.generateAuthorizationHeader(),
        },
        onUploadProgress,
      }
    );

    return uploadRes.data;
  }

  async delete(path: string) {
    if (!path.startsWith('/')) {
      throw new Error('`path` must start with `/`');
    }
    const requestRes = await this.httpClient.delete(`storage/o${path}`, {
      headers: {
        ...this.generateAuthorizationHeader(),
      },
    });
    return requestRes.data;
  }

  async getMetadata(path: string): Promise<object> {
    if (!path.startsWith('/')) {
      throw new Error('`path` must start with `/`');
    }
    const res = await this.httpClient.get(`storage/m${path}`, {
      headers: {
        ...this.generateAuthorizationHeader(),
      },
    });
    return res.data;
  }
}
