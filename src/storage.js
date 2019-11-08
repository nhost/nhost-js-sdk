import axios from 'axios';

export default class storage {
  constructor(config, inMemory) {
    this.inMemory = inMemory;
    this.endpoint = config.endpoint;
  }

  async put(path, file, metadata = null, onUploadProgress = false) {

    let form_data = new FormData();
    form_data.append('file', file);

    // TODO: insert x-metadata
    // const metadata_test = {
    //   'x-metadata-hejsan': 'test 1',
    //   'x-metadata-hejsan-2': 'test 2',
    // }

    const headers = {
      'Content-Type': 'multipart/form-data',
      'Authorization': `Bearer ${this.inMemory.jwt_token}`,
      'x-path': path,
      // ...metadata_test,
    }

    const upload_res = await axios.post(`${this.endpoint}/storage/upload`, form_data, {
      headers,
      onUploadProgress,
    });

    return upload_res.data;
  }

  async delete(path) {

    if (!path.startsWith('/')) {
      path = `/${path}`;
    }

    const res = await axios.delete(`${this.endpoint}/storage/file${path}`, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${this.inMemory.jwt_token}`,
        'x-path': path,
      },
    });

    return res.data;
  }

  async getDownloadURL(path) {

    if (!path.startsWith('/')) {
      path = `/${path}`;
    }

    const res = await axios.get(`${this.endpoint}/storage/fn/get-download-url${path}`, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${this.inMemory.jwt_token}`,
        'x-path': path,
      },
    });

    return `${this.endpoint}/storage/file${path}?token=${res.data.token}`
  }
}
