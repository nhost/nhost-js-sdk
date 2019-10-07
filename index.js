import jwt_decode from 'jwt-decode';
import axios from 'axios';

export default class nhost {
  constructor(config) {
    this.endpoint = config.endpoint;
    this.claims= null;

    this.logged_in = null;

    this.auth_state_change_function = null;

    this.interval = null;

    this.refreshToken = this.refreshToken.bind(this);
    this.autoLogin = this.autoLogin.bind(this);


    // use external storage?
    if(config.storage) {
      this.storage = config.storage
    } else {
      this.storage = localStorage;
    }

    this.inMemory = {
      jwt_token: null,
      user_id: null,
      exp: null,
    };

    this.autoLogin()
  }

  async autoLogin() {
    // try refresh token.
    const refresh_token_ok = await this.refreshToken();

    if (!refresh_token_ok) {
      // unable to login from refresh token
      return false;
    }

    window.addEventListener('storage', () => this.syncLogout());
    this.startRefetchTokenInterval();
  }

  async syncLogout() {
    const req = await axios(`${this.endpoint}/auth/logout`, {
      method: 'post',
      withCredentials: true,
    });
    this.clearStore();
    this.stopRefetchTokenInterval();

    if (this.logged_in) {
      this.logged_in = false;
      if (typeof this.auth_state_change_function === 'function') {
        this.auth_state_change_function(null);
      }
    }
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
    } = data;

    var claims = jwt_decode(jwt_token);

    this.claims = claims;

    this.storage.clear();
    this.storage.setItem('refetch_token', refetch_token);
    this.storage.setItem('user_id', user_id);

    this.inMemory['jwt_token'] = jwt_token;
    this.inMemory['user_id'] = user_id;
    this.inMemory['exp'] = (parseInt(claims.exp, 10) * 1000);

    if (!this.logged_in) {
      this.logged_in = true;
      if (typeof this.auth_state_change_function === 'function') {
        this.auth_state_change_function(data);
      } else {
        // console.log('no auth state change function')
      }
    }
  }

  getClaims() {
    return this.claims;
  }

  getJWTToken() {
    return this.inMemory['jwt_token'];
  }

  startRefetchTokenInterval() {
    this.interval = setInterval(this.refreshToken, (5*60*1000));
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
      const data = await this.refresh_token();
      this.setSession(data);
      return true;
    } catch (e) {
      return await this.logout();
    }
  }

  isAuthenticated() {
    return this.logged_in;
  }

  async register(email, username, password, register_data = null) {

    let req;
    try {
      req = await axios(`${this.endpoint}/auth/local/register`, {
        method: 'post',
        data: {
          email,
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
      const req = await axios(`${this.endpoint}/auth/local/login`, {
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

  async logout(all = false) {
    window.localStorage.setItem('logout', Date.now())

    if (all) {
      const req = await axios(`${this.endpoint}/auth/logout-all`, {
        method: 'post',
        withCredentials: true,
      });
    } else {
      const req = await axios(`${this.endpoint}/auth/logout`, {
        method: 'post',
        withCredentials: true,
      });
    }
    this.inMemory = {
      jwt_token: null,
      user_id: null,
      exp: null,
    };
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

  async refresh_token() {

    try {
      const req = await axios(`${this.endpoint}/auth/refresh-token`, {
        method: 'post',
        withCredentials: true,
      });

      return req.data;

    } catch (e) {
      throw e.response;
    }
  }


  async activate_account(secret_token) {

    try {
      const req = await axios(`${this.endpoint}/auth/local/activate-account`, {
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
      const req = await axios(`${this.endpoint}/auth/local/new-password`, {
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

  clearStore() {
    this.store = {
      jwt_token: null,
    };
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
