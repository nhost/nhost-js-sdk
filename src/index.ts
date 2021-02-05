import NhostClient from "./NhostClient";
import { UserConfig, NhostUser } from "./types";

const createClient = (config: UserConfig) => {
  return new NhostClient(config);
};

export { NhostClient, createClient, NhostUser };
