# Nhost JS SDK

Nhost JS SDK to handle **Auth** and **Storage**.

## Installation

`npm install --save nhost-js-sdk`

## Setup

In ex `/src/nhost/index.js`:

```js
import nhost from "nhost-js-sdk";

const config = {
  base_url: "https://backend-xxxx.nhost.app",
};

nhost.initializeApp(config);

const auth = nhost.auth();
const storage = nhost.storage();

export { auth, storage };
```

To use cookies (not recomended), use this config:

```js
const config = {
  base_url: "https://backend-xxxx.nhost.app",
  use_cookies: true,
};
```

## Usage auth and storage across in your app

`import { auth, storage } from 'src/nhost/index.js';`

## Configuration

### `base_url`

URL to your backend. Usually `https://backend-xxx.nhost.app`.

| Type   | Required | Default value |
| ------ | -------- | ------------- |
| string | Yes      |               |

### `use_cookies`

Use a HTTP Only Cookie for the `refresh_token`. Recommended value is `false` (default) because of cross platform issues and third party cookies issues in browsers.

| Type    | Required | Default value |
| ------- | -------- | ------------- |
| boolean | NO       | `false`       |

## Auth

### Register

```js
auth.register(email, password);
```

### Register with user_data

```js
auth.register(email, password, { display_name: "Joe Doe" });
```

### Login

```js
auth.login(email, password);
```

### Logout

```js
auth.logout();
```

### onAuthStateChanged

```js
auth.onAuthStateChanged((logged_in) => {
  console.log("auth state changed!");
  console.log({ logged_in });
});
```

### Check if user is authenticated

```js
auth.isAuthenticated();
```

### Get JWT token

```js
auth.getJWTToken();
```

### Get JWT claim

```js
auth.getClaim("x-hasura-user-id");
```

### Activate account

```js
auth.activate(<ticket>);
```

### Change email address

Note: The user must be logged in.

```js
auth.changeEmail(new_email);
```

### Request new email change

```js
auth.changeEmailRequest(new_email);
```

### Change to requested email

```js
auth.changeEmailChange(ticket);
```

### Change password

```js
auth.changePassword(old_password, new_password);
```

### Request new password

```js
auth.changePasswordRequest(email);
```

### Change password using ticket

```js
auth.changePasswordChange(new_password, ticket);
```

### Generate MFA QR-code

Note: User must be logged in.

```js
auth.MFAGenerate();
```

### Enable MFA

```js
auth.enable(code);
```

### Disable MFA

```js
auth.enable(code);
```

### Login using TOTP

Note: `ticket` comes from the `auth.login()` response if the user has MFA enabled.

```js
auth.MFATotp(code, ticket);
```

## Storage

### Upload

```
storage.put(path, file, metadata?, onUploadProgress?);
```

### Delete

```
storage.delete(path);
```

### Get metadata

```
storage.getMetadata(path);
```

## Setup in different environments

### React Native

Install:

`yarn add @react-native-community/async-storage`

More info: [https://react-native-community.github.io/async-storage/docs/install](https://react-native-community.github.io/async-storage/docs/install).

```js
import nhost from "nhost-js-sdk";
import AsyncStorage from "@react-native-community/async-storage";

const config = {
  base_url: "https://backend-xxxx.nhost.app",
  client_storage: AsyncStorage,
  client_storage_type: "react-native",
};

nhost.initializeApp(config);

const auth = nhost.auth();
const storage = nhost.storage();

export { auth, storage };
```

### Ionic

```js
import nhost from "nhost-js-sdk";
import { Plugins } from "@capacitor/core";
const { Storage } = Plugins;

const config = {
  base_url: "https://backend-xxxx.nhost.app",
  client_storage: Storage,
  client_storage_type: "capacitor",
};

nhost.initializeApp(config);

const auth = nhost.auth();
const storage = nhost.storage();

export { auth, storage };
```

### Expo

Install:

`expo install expo-secure-store`

More info: [https://docs.expo.io/versions/latest/sdk/securestore/](https://docs.expo.io/versions/latest/sdk/securestore/).

```js
import nhost from "nhost-js-sdk";
import * as SecureStore from "expo-secure-store";

const config = {
  base_url: "https://backend-xxxx.nhost.app",
  client_storage: SecureStore,
  client_storage_type: "expo-secure-storage",
};

nhost.initializeApp(config);

const auth = nhost.auth();
const storage = nhost.storage();

export { auth, storage };
```
