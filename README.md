# nhost-js-sdk

## Auth

- [x] register
- [x] activate account
- [x] sign in
- [x] implement refetch token strategy
- [x] new password

## Storage

- [x] Upload
- [x] Download

## usage

```
const config = {
  endpoint: 'http://localhost:8083',
};

const nhost = new nhost(config);
```

### Examples

#### Register user

```
await nhost.register(username, password);
```

#### Upload files

```
const res = await nhost.upload(path, files, onUploadProgress);
const url = nhost.url(file_key);
```
