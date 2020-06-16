// const compose = require("docker-compose");
// const path = require("path");

import * as compose from "docker-compose";
import path from "path";

module.exports = async () => {
  await compose.down({
    cwd: path.join(__dirname),
    log: true,
  });

  console.log("global TEARDOWN");
};
