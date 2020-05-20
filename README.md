# Nhost JS SDK

Nhost JS SDK to handle **Auth** and **Storage**.

## Installation

`npm install --save nhost-js-sdk`

## Setup

In ex `/src/nhost/index.js`:

```
import nhost from 'nhost-js-sdk';

const config = {
  endpoint: process.env.REACT_APP_BACKEND_ENDPOINT,
};

nhost.initializeApp(config);

const auth = nhost.auth();
const storage = nhost.storage();

export {
  auth,
  storage
};
```

## Usage auth and storage across in your app

`import { auth, storage } from 'src/nhost/index.js';`

## Auth

### Register

```
await auth.register(email, password);
```

### Login

```
await auth.login(email, password);
```

<!-- ### Login as an anonymous user

```
try {
  await auth.signInAnonymously();
} catch (e) {
  // handle error
}
``` -->

### Logout

```
auth.logout();
```

### onAuthStateChanged

```
auth.onAuthStateChanged(data => {
  console.log('auth state changed!');
  console.log({data});
});
```

<!-- ### Activate account

```
try {
  await auth.activate_account(secret_token);
} catch (e) {
  // handle error
}
```

### New password

```
try {
  await auth.new_password(secret_token, new_password);
} catch (e) {
  // handle error
}
``` -->

## Storage

### Upload file

`metadata` and `onUploadProgress` is optional

```
await storage.put(path, file, metadata, onUploadProgress);
```

### Get file

Go to `https://backend-[id].nhost.app/storage/o/${path}`.

### Delete file

```
await storage.delete(path);
```

<!-- ### Get downloadable URL of file

```
try {
  await storage.getDownloadURL(path);
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
``` -->
