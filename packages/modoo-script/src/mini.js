const pkg = require("package-json");
const fs = require("fs-extra");
const got = require("got");
const tar = require("tar");
const path = require("path");
const ora = require("ora");
const npmi = require("npmi");
const chalk = require("chalk");

const log = console.log;

const { renderAscii } = require("../utils");
const { MODOO_FRAMEWORK_REPO } = require("../utils/constants");

exports.miniPrompts = () => {
  const prompts = [];

  prompts.push({
    type: "input",
    name: "appId",
    message: "请输入 appId:",
    validate(input) {
      if (!input) {
        return "appId 不能为空!";
      }
      return true;
    },
    when(answer) {
      const { framework } = answer;
      return framework === "mini";
    }
  });

  return prompts;
};

exports.getBoilerplateMeta = framework => {
  return pkg(MODOO_FRAMEWORK_REPO[framework], {
    fullMetadata: true,
    registryUrl: "http://47.116.3.37:4873/"
  }).then(metadata => {
    const {
      dist: { tarball },
      version,
      name,
      keywords
    } = metadata;

    return {
      tarball,
      version,
      keywords,
      name
    };
  });
};

exports.createApp = async (conf, template) => {
  // 下载脚手架
  const { framework, projectName } = conf;
  const { tarball, version, keywords } = template;
  const proPath = path.join(process.cwd(), projectName);

  if (tarball <= 0) {
    log.error(`Invalid  template '${framework}'`);
    renderAscii();
    return false;
  }

  const spinner = ora(
    chalk.cyan(`正在下载 ${framework} 远程模板仓库...`)
  ).start();

  const stream = await got.stream(tarball);

  fs.mkdirSync(proPath);

  const tarOpts = {
    strip: 1,
    C: proPath
  };

  stream.pipe(tar.x(tarOpts)).on("close", () => {
    spinner.succeed(chalk.green("下载远程模块完成！"));
    const ignoreStream = fs.createWriteStream(path.join(proPath, ".gitignore"));

    log(" ".padEnd(2, "\n"));
    log(chalk.gray("开始下载 npm packages..."));

    ignoreStream.on("close", () => {
      fs.existsSync(path.join(proPath, "package.json")) &&
        npmi(
          {
            path: proPath,
            localInstall: true
          },
          (error, result) => {
            if (error) {
              return console.error(error);
            }
            log(
              chalk.green(`Successed install ${result.length} npm packages.`)
            );
            log("", null, false);
            log("", null, false);
            log(chalk.green("Project finish init Enjoy youself!"));
            renderAscii();
          }
        );
    });
    // log.info("Start install npm packages ...");
  });
};
