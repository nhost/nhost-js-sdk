import nhost from "../index";

const config = {
  baseURL: "http://localhost:3000",
};

nhost.initializeApp(config);

const auth = nhost.auth();
const storage = nhost.storage();

export { auth, storage };
