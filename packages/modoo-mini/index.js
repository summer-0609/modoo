const fs = require("fs-extra");
const os = require("os");
const path = require("path");

const projectConfig = require("./project.config.json");
fs.writeFile(
  "./project.config.json",
  JSON.stringify(
    Object.assign(projectConfig, {
      projectname: "321312",
      description: "12s12",
      api: "312312"
    }),
    null,
    2
  ) + os.EOL
);
