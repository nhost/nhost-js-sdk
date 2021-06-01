import * as compose from "docker-compose";
import path from "path";
import axios from "axios";
import fs from "fs-extra";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async (): Promise<void> => {
  console.log("global setup.");

  const test_path = path.join(__dirname);

  // stop previous docker compose, if ended unexpectedly
  await compose.down({ cwd: test_path, log: true });

  //remove ./db_data folder
  await fs.removeSync(`${test_path}/db_data`);

  // start docker compose
  await compose.buildAll({ cwd: test_path, log: true, commandOptions: ['--no-cache'] });
  await compose.upAll({ cwd: test_path, log: true });

  // wait until HBP and Hasura is up
  let backendOnline = false;
  let retries = 0;
  const maxRetries = 20;
  while (!backendOnline && retries < maxRetries) {
    try {
      // both hbp and the graphql engine must be up
      await axios.get("http://localhost:3000/healthz");
      await axios.get("http://localhost:8080/healthz");
      backendOnline = true;
    } catch (error) {
      console.log(`Backend not online. Test ${retries}/${maxRetries}`);
      await sleep(5 * 1000);
      retries += 1;
      continue;
    }
  }
};
