const compose = require("docker-compose");
const path = require("path");
const fs = require("fs-extra");

module.exports = async () => {
  console.log("global TEARDOWN");

  // docker-compose down
  await compose.down({
    cwd: path.join(__dirname),
    log: true,
  });
};
