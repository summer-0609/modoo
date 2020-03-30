#!/usr/bin/env node
"use strict";

const { program } = require("commander");

program
  .version(require("../package").version)
  .usage("<command> [options]")
  .command("init [projectName]", "Init a project with default templete")
  .command("start", "Start a project with options")
  .command("build", "Build a project with options")
  .parse(process.argv);

if (!program.args.length) {
  program.help();
}
