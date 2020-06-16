# Nhost JS SDK

Nhost JS SDK to handle **Auth** and **Storage**.

## Installation

`npm install --save nhost-js-sdk`

## Setup

In ex `/src/nhost/index.js`:

```
import nhost from 'nhost-js-sdk';

const config = {
  endpoint: 'https://backend-xxxx.nhost.app',
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
auth.register(email, password);
```

### Login

```
auth.login(email, password);
```

### Logout

```
auth.logout();
```

### onAuthStateChanged

```
auth.onAuthStateChanged(logged_in => {
  console.log('auth state changed!');
  console.log({logged_in});
});
```

### Check if user is authenticated

```
auth.isAuthenticated();
```

### Get JWT token

```
auth.getJWTToken();
```

### Get JWT claim

```
auth.getClaim('x-hasura-user-id');
```

### Activate account

```
auth.activate(<ticket>);
```

### Change email address

Note: The user must be logged in.

```
auth.changeEmail(new_email);
```

### Request new email change

```
auth.changeEmailRequest(new_email);
```

### Change to requested email

```
auth.changeEmailChange(ticket);
```

### Change password

```
auth.changePassword(old_password, new_password);
```

### Request new password

```
auth.changePasswordRequest(email);
```

### Change password using ticket

```
auth.changePasswordChange(new_password, ticket);
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
auth.getMetadata(path);
```
