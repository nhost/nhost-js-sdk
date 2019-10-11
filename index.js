import jwt_decode from 'jwt-decode';
import queryString from 'query-string';import axios from 'axios';

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

    // if callback from other OAuth provider
    if (this.storage.getItem('refresh_token') == null) {

      const parsed = queryString.parse(window.location.search);

      if ('refresh_token' in parsed) {

        this.storage.setItem('refresh_token', parsed.refresh_token);

        // remove `refresh_token` and `auth_success` from url
        let new_url = this._removeParam('refresh_token', window.location.href)
        new_url = this._removeParam('auth_success', new_url);

        try {
          window.history.pushState({}, document.title, new_url);
        } catch {
          // window object not available
        }
      }
    }

    this.inMemory = {
      storage_jwt_token: null,
      jwt_token: null,
      claims: null,
    };

    this.autoLogin()
  }

  _removeParam(key, sourceURL) {
    var rtn = sourceURL.split("?")[0],
    param,
    params_arr = [],
    queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
      params_arr = queryString.split("&");
      for (var i = params_arr.length - 1; i >= 0; i -= 1) {
        param = params_arr[i].split("=")[0];
        if (param === key) {
          params_arr.splice(i, 1);
        }
      }
      if (params_arr.length > 0) {
        rtn = rtn + "?" + params_arr.join("&");
      }
    }
    return rtn;
  }

  async autoLogin() {
    // try refresh token.
    const refresh_token_ok = await this.refreshToken();

    if (!refresh_token_ok) {
      // unable to login from refresh token
      return false;
    }

    try {
      window.addEventListener('storage', (event) => this.syncLogout(event));
    } catch (e) {
      // nothing..
    }

    this.startRefreshTokenInterval();
  }

  async syncLogout(event) {

    if (event.key !== 'logout') return;

    const req = await axios(`${this.endpoint}/auth/logout`, {
      method: 'post',
      withCredentials: true,
    });
    this.clearStore();
    this.stopRefreshTokenInterval();

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
    this.startRefreshTokenInterval();
  }

  setSession(data) {
    const {
      storage_jwt_token,
      refresh_token,
      jwt_token,
    } = data;

    this.storage.setItem('refresh_token', refresh_token);

    var claims = jwt_decode(jwt_token);

    this.inMemory['storage_jwt_token'] = storage_jwt_token;
    this.inMemory['jwt_token'] = jwt_token;
    this.inMemory['claims'] =   claims['https://hasura.io/jwt/claims'];

    if (this.logged_in !== true) {
      this.logged_in = true;
      if (typeof this.auth_state_change_function === 'function') {
        this.auth_state_change_function(data);
      } else {
        // console.log('no auth state change function')
      }
    }
  }

  getClaims() {
    return this.inMemory['claims'];
  }

  getClaim(claim) {
    return this.inMemory['claims'][claim];
  }

  getJWTToken() {
    return this.inMemory['jwt_token'];
  }

  startRefreshTokenInterval() {
    this.interval = setInterval(this.refreshToken, (5*60*1000));
  }

  stopRefreshTokenInterval() {
    clearInterval(this.interval);
  }


  async refreshToken() {
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


    try {
      window.localStorage.setItem('logout', Date.now())
    } catch (e) {
      // nothing
    }

    const refresh_token = this.storage.getItem('refresh_token');

    if (all) {
      const req = await axios(`${this.endpoint}/auth/logout-all`, {
        data: {
          refresh_token,
        },
        method: 'post',
        withCredentials: true,
      });
    } else {
      const req = await axios(`${this.endpoint}/auth/logout`, {
        data: {
          refresh_token,
        },
        method: 'post',
        withCredentials: true,
      });
    }
    this.inMemory = {
      jwt_token: null,
      exp: null,
    };

    this.storage.clear()
    this.stopRefreshTokenInterval();

    if (this.logged_in) {
      this.logged_in = false;
      if (typeof this.auth_state_change_function === 'function') {
        this.auth_state_change_function(null);
      }
    }
    return false;
  }

  async refresh_token() {

    const refresh_token = this.storage.getItem('refresh_token');

    if (refresh_token == null) {
      return false;
    }

    try {
      const req = await axios(`${this.endpoint}/auth/refresh-token`, {
        data: {
          refresh_token
        },
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
