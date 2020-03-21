const inquirer = require("inquirer");
const fs = require("fs-extra");

const { getUserHomeDir } = require("../utils");
const { miniPrompts } = require("../src/mini.js");

class Init {
  constructor(options) {
    this.conf = Object.assign(
      {
        projectName: "",
        projectDir: "",
        template: "",
        description: ""
      },
      options
    );
    console.log(3);
  }
  init() {
    console.log(chalk.green(`modoo-script 即将创建一个新项目!`));
    console
      .log
      //   "Need help? Go and open issue: https://github.com/NervJS/taro/issues/new"
      ();
    console.log("Wait for a monment...");
    console.log();
  }
  create() {
    this.fetchTemplates();
    // this.ask().then(answer => {
    //   console.log(1, answer);
    // });
  }
  ask() {
    const prompts = [];
    const conf = this.conf;

    this.askFrameWork(conf, prompts);
    this.askProjectName(conf, prompts);
    this.askMini(prompts);

    this.askCSS(conf, prompts);

    return inquirer.prompt(prompts);
  }
  askFrameWork(conf, prompts) {
    if (typeof conf.framework !== "string") {
      prompts.push({
        type: "list",
        name: "framework",
        message: "请选择脚手架框架",
        // 暂时只有 微信原生小程序，之后加入 vue/react
        choices: [{ name: "微信原生小程序", value: "mini" }]
      });
    }
  }
  askProjectName(conf, prompts) {
    if (typeof conf.projectName !== "string") {
      prompts.push({
        type: "input",
        name: "projectName",
        message: "请输入项目名称:",
        validate(input) {
          if (!input) {
            return "项目名不能为空！";
          }
          if (fs.existsSync(input)) {
            return "当前目录已经存在同名项目，请换一个项目名！";
          }
          return true;
        }
      });
    } else if (fs.existsSync(conf.projectName)) {
      prompts.push({
        type: "input",
        name: "projectName",
        message: "当前目录已经存在同名项目，请换一个项目名！",
        validate(input) {
          if (!input) {
            return "项目名不能为空！";
          }
          if (fs.existsSync(input)) {
            return "项目名依然重复！";
          }
          return true;
        }
      });
    }
  }
  askMini(prompts) {
    prompts.push(...miniPrompts());
  }
  askCSS(conf, prompts) {
    const cssChoices = [
      {
        name: "原生",
        value: "wxss"
      },
      {
        name: "Sass",
        value: "sass"
      },
      {
        name: "Less",
        value: "less"
      }
    ];

    if (typeof conf.css !== "string") {
      prompts.push({
        type: "list",
        name: "css",
        message: "请选择 CSS 预处理器 (sass/less/none): ",
        choices: cssChoices
      });
    }
  }
  // 下载其他模版源
  fetchTemplates() {
    const conf = this.conf;
    // 使用默认模版
    if (conf.template && conf.template === "default") {
      return Promise.resolve([]);
    }

    //没有输入模版源
    if (!conf.templateSource) {
      const homedir = getUserHomeDir();
      console.log(homedir);
      if (!homedir) {
        chalk.yellow("找不到用户根目录，使用默认模版源！");
        // conf.templateSource = DEFAULT_TEMPLATE_SRC;
      }
    }
  }
}

module.exports = Init;
