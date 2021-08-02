import axios from 'axios';
import { NhostClient } from '../src/index';

const config = {
  baseURL: 'http://localhost:3000',
};

class TestNhostClient extends NhostClient {
  protected httpClient = axios.create({
    baseURL: `${this.baseURL}`,
    timeout: 10000,
    withCredentials: this.useCookies,
  });

  public async withEnv(
    env: Record<string, string>,
    cb: () => Promise<any>,
    rollbackEnv?: Record<string, string>
  ) {
    await this.httpClient.post('/change-env', env);
    await cb();
    if (rollbackEnv) {
      await this.httpClient.post('/change-env', rollbackEnv);
    }
  }
}

export const nhost = new TestNhostClient(config);

export const auth = nhost.auth;

export const storage = nhost.storage;
