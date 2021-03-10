import NhostClient from "./NhostClient";
import { UserConfig, User, Session } from "./types";

const createClient = (config: UserConfig) => {
  return new NhostClient(config);
};

export { NhostClient, createClient, User, Session, UserConfig };
