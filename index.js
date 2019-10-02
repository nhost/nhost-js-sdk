import jwt_decode from 'jwt-decode';
import axios from 'axios';

export default class nhost {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.claims= null;

    this.logged_in = null;

    this.auth_state_change_function = null;

    this.interval = null;

    this.refetchToken = this.refetchToken.bind(this);
    this.autoLogin = this.autoLogin.bind(this);

    // check what storage type:
    if (config.storage_type === 'asyncStorage') {
      this.storage = asyncStorage;
    } else {
      this.storage = localStorage;
    }

    this.autoLogin()
  }

  async autoLogin() {
    // try refetch token.
    const refetch_token_ok = await this.refetchToken();

    if (!refetch_token_ok) {
      // unable to login from refetch token
      return false;
    }

    this.startRefetchTokenInterval();
  }

  onAuthStateChanged(f) {
    // set custom onAuthStateChanged function
    this.auth_state_change_function = f;
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

    var claims = jwt_decode(jwt_token);

    this.storage.clear();
    this.storage.setItem('refetch_token', refetch_token);
    this.storage.setItem('user_id', user_id);

    this.claims = claims;

    sessionStorage.clear();
    sessionStorage.setItem('jwt_token', jwt_token);
    sessionStorage.setItem('user_id', user_id);
    sessionStorage.setItem('exp', (parseInt(claims.exp, 10) * 1000));

    if (!this.logged_in) {
      this.logged_in = true;
      if (typeof this.auth_state_change_function === 'function') {
        this.auth_state_change_function(data);
      } else {
        console.log('no auth state change function')
      }
    }
  }

  getClaims() {
    return this.claims;
  }

  getJWTToken() {
    return sessionStorage.getItem('jwt_token');
  }

  startRefetchTokenInterval() {
    this.interval = setInterval(this.refetchToken, (5*60*1000));
  }

  stopRefetchTokenInterval() {
    clearInterval(this.interval);
  }

  async refetchToken() {

    const user_id = this.storage.getItem('user_id');
    const refetch_token = this.storage.getItem('refetch_token');

    if (!user_id || !refetch_token) {
      return this.logout();
    }

    try {
      const data = await this.refetch_token(user_id, refetch_token);
      this.setSession(data);
      return true;
    } catch (e) {
      console.error('error fetching new token using refetch token');
      console.error({e});
      return this.logout();
    }
  }


  isAuthenticated() {
    return this.logged_in;
  }

  async register(username, password, register_data = null) {

    let req;
    try {
      req = await axios(`${this.endpoint}/auth/register`, {
        method: 'post',
        data: {
          username,
          password,
          register_data,
        },
        withCredentials: true,
      });
    } catch (e) {
      throw e.response;
    }

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
    this.storage.clear();
    this.stopRefetchTokenInterval();

    if (this.logged_in) {
      this.logged_in = false;
      if (typeof this.auth_state_change_function === 'function') {
        this.auth_state_change_function(null);
      }
    }
    return false;
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
