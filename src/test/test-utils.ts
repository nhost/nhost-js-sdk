import { createClient } from "../index";

const config = {
  baseURL: "http://localhost:3000",
};

const nhost = createClient(config);

export const { auth, storage } = nhost;
