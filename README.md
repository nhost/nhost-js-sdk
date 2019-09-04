# nhost-js-sdk

Nhost js sdk to handle **Auth** and **Storage**.

## Installation

`npm install --save nhost-js-sdk`


## Setup

in ex `/src/nhost/index.js`:

```
import nhost from 'nhost-js-sdk';
import { BACKEND_ENDPOINT } from '../config';

const config = {
  endpoint: 'https://backend-xxxxxx.nhost.io/'
};

export default new nhost(config);
```


## Usage across in your app

`import nhost from '../nhost';`


## Auth

### Register

```
try {
  await nhost.register(username, password);
} catch (e) {
  // handle error
}
```

### Login

```
try {
  await nhost.login(username, password);
} catch (e) {
  // handle error
}
```

### Logout

```
  nhost.logout();
```

### onAuthStateChanged

```
nhost.onAuthStateChanged(data => {
  console.log('auth state changed!');
  console.log({data});
});
```


### Activate account

```
try {
  await nhost.activate_account(secret_token);
} catch (e) {
  // handle error
}
```


### New password

```
try {
  await nhost.new_password(secret_token, new_password);
} catch (e) {
  // handle error
}
```

## Storage

### Upload file(s)

```
try {
  await nhost.upload(path, files);
} catch (e) {
  // handle error
}
```


### Get file url

```
try {
  await nhost.url(file_path);
} catch (e) {
  // handle error
}
```
