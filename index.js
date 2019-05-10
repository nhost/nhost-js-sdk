import jwt from 'jsonwebtoken';
import axios from 'axios';

export default class nhost {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.claims= null;

    this.interval = null;
  }

  initSession(data) {
    this.setSession(data);
    this.startRefetchTokenInterval();
  }

  setSession(data) {
    const {
      jwt_token,
      refetch_token,
      user_id,
    } = data;

    var claims = jwt.decode(jwt_token);

    localStorage.clear();
    localStorage.setItem('refetch_token', refetch_token);
    localStorage.setItem('user_id', user_id);

    this.claims = claims;

    sessionStorage.clear();
    sessionStorage.setItem('jwt_token', jwt_token);
    sessionStorage.setItem('user_id', user_id);
    sessionStorage.setItem('exp', (parseInt(claims.exp, 10) * 1000));
  }

  getClaims() {
    return this.claims;
  }

  startRefetchTokenInterval() {
    this.interval = setInterval(this.refetchToken, 60000);
  }

  stopRefetchTokenInterval() {
    clearInterval(this.interval);
  }

  async refetchToken() {

    const user_id = localStorage.getItem('user_id');
    const refetch_token = localStorage.getItem('refetch_token');

    if (!user_id || !refetch_token) {
      return;
    }

    try {
      const data = await this.refetch_token(user_id, refetch_token);
      this.setSession(data);
    } catch (e) {
      console.error('error fetching new token using refetch token');
      console.error({e});
      this.logout();
    }
  }


  async isAuthenticated() {
    return new Date().getTime() < sessionStorage.getItem('exp');
  }

  async register(username, password) {

    let req;
    try {
      req = await axios(`${this.endpoint}/auth/register`, {
        method: 'post',
        data: {
          username,
          password,
        },
        withCredentials: true,
      });
    } catch (e) {
      throw e.response;
    }

    this.initSession(req.data);

    return req.data;
  }

  async login(username, password) {

    let data;

    try {
      const req = await axios(`${this.endpoint}/auth/login`, {
        method: 'post',
        data: {
          username,
          password,
        },
        withCredentials: true,
      });

      data = req.data;

    } catch (e) {
      throw e.response;
    }

    this.initSession(data);
  }

  logout() {
    sessionStorage.clear();
    localStorage.clear();
    this.stopRefetchTokenInterval();
  }

  async refetch_token(user_id, refetch_token) {

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


  async activate_account(secret_token) {

    try {
      const req = await axios(`${this.endpoint}/auth/activate-account`, {
        method: 'post',
        data: {
          secret_token,
        },
        withCredentials: true,
      });

      return req.data;

    } catch (e) {
      throw e.response;
    }
  }

  async new_password(secret_token, password) {

    try {
      const req = await axios(`${this.endpoint}/auth/new-password`, {
        method: 'post',
        data: {
          secret_token,
          password,
        },
        withCredentials: true,
      });

      return req.data;

    } catch (e) {
      throw e.response;
    }
  }


  // upload file
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

  // get file url
  url(path) {
    return `${this.endpoint}/storage/file/${path}`;
  }
}
