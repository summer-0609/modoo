#!/usr/bin/env node

const { program } = require("commander");

program
  .version(require("../package").version)
  .usage("<command> [options]")
  .command("init [projectName]", "Init a project with default templete")
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}
