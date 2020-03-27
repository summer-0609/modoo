#!/usr/bin/env node

const { program } = require("commander");
const devStart = require("../scripts/react-start");

program
  .option("--env [env]", "Env type")
  .option("--port [port]", "Specified port")
  .parse(process.argv);

const { env, port } = program.args;

devStart({ env, port });
