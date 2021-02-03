import NhostClient from "./NhostClient"
import { UserConfig } from "./types";

const createClient = (config: UserConfig) => {
  return new NhostClient(config);
};

export { NhostClient, createClient };

