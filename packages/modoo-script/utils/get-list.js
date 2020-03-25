const { execSync } = require("child_process");

module.exports = () => {
  let list = [];
  try {
    const listJSON = execSync(
      "npm search  --json --registry https://registry.npmjs.com/ @modoo/modoo-template"
    );
    list = JSON.parse(listJSON);
  } catch (error) {}

  return Promise.resolve(list);
};
