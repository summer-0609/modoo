const path = require("path");

const templatePath = path.join(
  require.resolve("@modoo/modoo-template-mini", { paths: ["aaa"] }),
  ".."
);

console.log(templatePath);
