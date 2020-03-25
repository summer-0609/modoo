#!/usr/bin/env node

const { program } = require("commander");
const init = require("../scripts/init");

program
  .option("--name [name]", "项目名称")
  .option("--description [description]", "项目介绍")
  .option("--framework", "脚手架框架")
  .option("--clone [clone]", "拉取远程模板时使用git clone")
  .parse(process.argv);

const args = program.args;
const { name, description, framework } = program;

const projectName = args[0] || name;

new init({
  projectName,
  projectDir: process.cwd(),
  description,
  framework
}).create();
