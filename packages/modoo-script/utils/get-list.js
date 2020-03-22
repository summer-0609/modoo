const { execSync } = require("child_process");

module.exports = () => {
  let list = [];
  try {
    const listJSON = execSync(
      "npm search  --json --registry http://47.116.3.37:4873/ @modoo/modoo-"
    );
    list = JSON.parse(listJSON);
  } catch (error) {}

  return Promise.resolve(list);
};
