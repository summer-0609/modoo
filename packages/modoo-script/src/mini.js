const pkg = require("package-json");
const fs = require("fs-extra");
const got = require("got");
const tar = require("tar");
const path = require("path");
const ora = require("ora");
const npmi = require("npmi");
const chalk = require("chalk");
const deepExtend = require("deep-extend");

const log = console.log;

const { renderAscii, template, readFiles } = require("../utils");

function initProject(proPath, inject) {
  const pkgPath = path.join(proPath, "package.json");
  const pkgObj = require(pkgPath);
  fs.createWriteStream(pkgPath).end(
    JSON.stringify(
      deepExtend({}, pkgObj, {
        name: inject.ProjectName,
        version: "1.0.0",
        private: true
      }),
      null,
      "  "
    )
  );
  readFiles(
    proPath,
    {
      ignore: [
        ".{pandora,git,idea,vscode,DS_Store}/**/*",
        "{scripts,dist,node_modules}/**/*",
        "**/*.{png,jpg,jpeg,gif,bmp,webp}"
      ],
      gitignore: true
    },
    ({ path, content }) => {
      fs.createWriteStream(path).end(template(content, inject));
    }
  );
}

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
      return framework.split("-").pop() === "mini";
    }
  });

  return prompts;
};

exports.getBoilerplateMeta = framework => {
  log(chalk.gray(`您已选择 ${framework} 远程模版。`));
  return pkg(framework, {
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
  const { framework, projectName, appId, description } = conf;
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

    log(" ".padEnd(2, "\n"));
    log(chalk.gray("开始下载 npm packages..."));

    initProject(proPath, {
      AppId: appId,
      ProjectName: projectName,
      Description: description
    });

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
          log(chalk.green(`Successed install ${result.length} npm packages.`));
          log("", null, false);
          log("", null, false);
          log(chalk.green("Project finish init Enjoy youself!"));
          renderAscii();
        }
      );
  });
};
