const compose = require("docker-compose");
const path = require("path");
const axios = require("axios");
const fs = require("fs-extra");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async (): Promise<void> => {
  console.log();
  await migrate();
  await migrate({ migrations: "./test-mocks/migrations" });
};

module.exports = async () => {
  console.log("global setup.");

  const test_path = path.join(__dirname) + "/test";

  //remove ./db_data folder

  await fs.removeSync(`${test_path}/db_data`);

  await compose.upAll({ cwd: path.join(__dirname), log: true });

  let backend_online = false;
  let retries = 0;
  const max_retries = 20;
  while (!backend_online && retries < max_retries) {
    let res;
    try {
      // both hbp and the graphql engine must be up
      await axios.get("http://localhost:3000/healthz");
      await axios.get("http://localhost:8080/healthz");
      backend_online = true;
    } catch (error) {
      console.log(`Backend not online. Test ${retries}/${max_retries}`);
      await sleep(5 * 1000);
      retries += 1;
      continue;
    }
  }
};
