import axios from 'axios';

export default class nhost {
  constructor(config) {
    this.endpoint = config.endpoint;
  }

  async register(username, password) {

    try {
      const req = await axios(`${this.endpoint}/auth/register`, {
        method: 'post',
        data: {
          username,
          password,
        },
        withCredentials: true,
      });

      return req.data;

    } catch (e) {
      throw e.response;
    }
  }

  async login(username, password) {

    try {
      const req = await axios(`${this.endpoint}/auth/login`, {
        method: 'post',
        data: {
          username,
          password,
        },
        withCredentials: true,
      });

      return req.data;

    } catch (e) {
      throw e.response;
    }
  }

  async refetch_token(user_id, refetch_token) {

    console.log('ok')
    try {
      const req = await axios(`${this.endpoint}/auth/refetch-token`, {
        method: 'post',
        data: {
          user_id,
          refetch_token,
        },
        withCredentials: true,
      });

      return req.data;

    } catch (e) {
      throw e.response;
    }
  }


  // Storage Upload
  async upload(path, files, onUploadProgress = false) {

    let form_data = new FormData();

    files.forEach(file => {
      form_data.append('files', file);
    });

    const upload_res = await axios.post(`${this.endpoint}/storage/upload`, form_data, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-path': path,
      },
      onUploadProgress: onUploadProgress,
      withCredentials: true,
    });

    return upload_res.data;
  }

  url(path) {
    return `${this.endpoint}/storage/file/${path}`;
  }
}
