"use strict";

const pkg = require("package-json");
const fs = require("fs-extra");
const got = require("got");
const tar = require("tar");
const path = require("path");
const ora = require("ora");
const logSymbols = require("log-symbols");

const { exec } = require("child_process");
const chalk = require("chalk");
const deepExtend = require("deep-extend");

const log = console.log;

const {
  renderAscii,
  template,
  readFiles,
  shouldUseYarn,
  shouldUseCnpm
} = require("../utils");

// 覆盖脚手架配置属性
function initProject(proPath, inject) {
  const pkgPath = path.join(proPath, "package.json");
  const pkgObj = require(pkgPath);

  fs.createWriteStream(pkgPath).end(
    JSON.stringify(
      deepExtend({}, pkgObj, {
        name: inject.ProjectName,
        description: inject.Description,
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
  log(
    logSymbols.info,
    chalk.cyan(`您已选择 ${framework} 远程模版, 正在查询该模版...`)
  );

  return pkg(framework, {
    fullMetadata: true
  }).then(metadata => {
    const {
      dist: { tarball },
      version,
      name,
      keywords
    } = metadata;
    log(
      logSymbols.success,
      chalk.green(`已为您找到 ${framework} 远程模版, 请输入配置信息`)
    );

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
  const { tarball } = template;
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

  // 管道流传输下载文件到当前目录
  stream.pipe(tar.x(tarOpts)).on("close", () => {
    spinner.succeed(chalk.green("下载远程模块完成！"));

    initProject(proPath, {
      AppId: appId,
      ProjectName: projectName,
      Description: description
    });

    process.chdir(proPath);

    // git init
    const gitInitSpinner = ora(
      `cd ${chalk.cyan.bold(projectName)}, 执行 ${chalk.cyan.bold("git init")}`
    ).start();

    const gitInit = exec("git init");
    gitInit.on("close", code => {
      if (code === 0) {
        gitInitSpinner.color = "green";
        gitInitSpinner.succeed(gitInit.stdout.read());
      } else {
        gitInitSpinner.color = "red";
        gitInitSpinner.fail(gitInit.stderr.read());
      }
    });

    let command = "";
    if (shouldUseYarn()) {
      command = "yarn";
    } else if (shouldUseCnpm()) {
      command = "cnpm install";
    } else {
      command = "npm install";
    }

    log(" ".padEnd(2, "\n"));
    const installSpinner = ora(
      `执行安装项目依赖 ${chalk.cyan.bold(command)}, 需要一会儿...`
    ).start();

    if (fs.existsSync(path.join(proPath, "package.json"))) {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          installSpinner.color = "red";
          installSpinner.fail(chalk.red("安装项目依赖失败，请自行重新安装！"));
          console.log(error);
        } else {
          installSpinner.color = "green";
          installSpinner.succeed("安装成功");
          log(`${stderr}${stdout}`);
        }
        log("");
        log("");
        log(
          logSymbols.success,
          chalk.green(`创建项目 ${chalk.green.bold(projectName)} 成功！`)
        );
        log(
          logSymbols.success,
          chalk.green(
            `请进入项目目录 ${chalk.green.bold(projectName)} 开始工作吧！😝`
          )
        );
        renderAscii();
      });
    }
  });
};
