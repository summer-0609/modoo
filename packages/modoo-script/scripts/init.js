const inquirer = require("inquirer");
const fs = require("fs-extra");
const ora = require("ora");
const chalk = require("chalk");

const getList = require("../utils/get-list");

const { miniPrompts, getBoilerplateMeta, createApp } = require("../src/mini");
const { MODOO_FRAMEWORK_NAME } = require("../utils/constants");

// 需要渲染的模版数据
let template = undefined;

async function searchNpm(answers) {
  const { framework } = answers;
  template = await getBoilerplateMeta(framework);
  return true;
}

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
    // 所有的框架模版
    this.frameworks = [];
  }

  async init() {
    console.log(chalk.green(` modoo-script 即将创建一个新项目!`));
    const spinner = ora(
      chalk.green("modoo-script 正在查找远程仓库模版...")
    ).start();

    const list = await getList().catch(
      ({ message = "Get boilerplates failed." }) => {
        log.error(message);
      }
    );
    if (list.length) {
      spinner.succeed(chalk.green("modoo-script 已成功找到找到远程模版!"));
      console.log();
      this.frameworks = list.map(({ name }) => ({
        name,
        framework: name.split("-").pop()
      }));
    }
  }
  create() {
    this.init().then(() => {
      this.ask().then(answers => {
        this.conf = Object.assign(this.conf, answers);
        this.write();
      });
    });
  }
  ask() {
    const prompts = [];
    const conf = this.conf;

    this.askFrameWork(conf, prompts);
    this.askProjectName(conf, prompts);
    this.askDescription(conf, prompts);
    this.askMini(prompts);

    // 暂时只有 less
    // this.askCSS(conf, prompts);
    return inquirer.prompt(prompts);
  }
  askFrameWork(conf, prompts) {
    if (typeof conf.framework !== "string") {
      const choices = this.frameworks.map(item => ({
        name: MODOO_FRAMEWORK_NAME[item.framework],
        value: item.name
      }));

      prompts.push({
        type: "list",
        name: "framework",
        message: "请选择脚手架框架",
        // 暂时只有 微信原生小程序，之后加入 vue/react
        choices
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
        },
        when: answers => searchNpm(answers)
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
        },
        when: answers => searchNpm(answers)
      });
    }
  }
  askDescription(conf, prompts) {
    if (typeof conf.description !== "string") {
      prompts.push({
        type: "input",
        name: "description",
        message: "请输入项目介绍:",
        when: answers => {
          if (!template) {
            searchNpm(answers);
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
    if (typeof conf.css !== "string") {
      prompts.push({
        type: "list",
        name: "css",
        message: "请选择 CSS 处理器（Wxss/Sass/Less）",
        choices: [
          {
            name: "Wxss",
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
        ]
      });
    }
  }
  write() {
    createApp(this.conf, template);
  }
}

module.exports = Init;
