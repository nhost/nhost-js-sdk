import NhostClient from "./NhostClient"

const createClient = () => {
  return new NhostClient();
}

export { NhostClient, createClient };

