# hbp-js-sdk

# WIP

## Auth

[ ] register

[ ] activate account

[ ] sign in

[ ] implement refetch token strategy

[ ] new password

## Storage

[x] Upload

[x] Download

## usage

```
const config = {
  endpoint: 'http://localhost:8083',
};

const hbp = new hbp(config);
```

### examples

```
const res = await hbp.upload(path, files, onUploadProgress);
const url = hbp.url(file_key);
```
