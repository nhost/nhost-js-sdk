# nhost-js-sdk

# WIP

## Auth

- [ ] register
- [ ] activate account
- [ ] sign in
- [ ] implement refetch token strategy
- [ ] new password

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

### examples

```
const res = await nhost.upload(path, files, onUploadProgress);
const url = nhost.url(file_key);
```
