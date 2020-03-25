const { execSync } = require("child_process");

module.exports = () => {
  let list = [];
  try {
    const listJSON = execSync(
      "npm search  --json --registry http://registry.npmjs.org/ @modoo/modoo-template"
    );
    list = JSON.parse(listJSON);
  } catch (error) {}

  return Promise.resolve(list);
};
