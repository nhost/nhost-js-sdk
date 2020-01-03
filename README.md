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

`register_data` is optional

```
try {
  await nhost.register(email, username, password, register_data);
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

### Upload file

`metadata` is optional
`onUploadProgress` is optional

```
try {
  await nhost.put(path, file, metadata, onUploadProgress);
} catch (e) {
  // handle error
}
```

### Delete file

```
try {
  await nhost.delete(path);
} catch (e) {
  // handle error
}
```

### Get downloadable URL of file

```
try {
  await nhost.getDownloadURL(path);
} catch (e) {
  // handle error
}
```


# React Native

For React Native you can pass in `asyncStorage` for nhost to use instead of the default `localStorage`.

```
import nhost from 'nhost-js-sdk';
import { AsyncStorage } from 'react-native';
import { BACKEND_ENDPOINT } from '../config';

const config = {
  endpoint: 'https://backend-xxxxxx.nhost.io/'
  storage: AsyncStorage
};

export default new nhost(config);
```
