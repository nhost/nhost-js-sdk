import NhostClient from "./NhostClient";
import { UserConfig, User } from "./types";

const createClient = (config: UserConfig) => {
  return new NhostClient(config);
};

export { NhostClient, createClient, User };
