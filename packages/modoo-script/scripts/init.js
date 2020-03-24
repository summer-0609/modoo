const inquirer = require("inquirer");
const fs = require("fs-extra");
const ora = require("ora");
const chalk = require("chalk");

const { miniPrompts, getBoilerplateMeta, createApp } = require("../src/mini");

const getList = require("../utils/get-list");

// 需要渲染的模版数据
let template = {};

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
  }
  async init() {
    console.log(chalk.gray("modoo-script 即将创建一个新项目!"));
    console.log();

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
    }
    return list;
  }
  create() {
    this.init().then(list => {
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

    // this.askCSS(conf, prompts);
    return inquirer.prompt(prompts);
  }
  askFrameWork(conf, prompts) {
    if (typeof conf.framework !== "string") {
      prompts.push({
        type: "list",
        name: "framework",
        message: "请选择脚手架框架",
        // 暂时只有 微信原生小程序，之后加入 vue/react
        choices: [
          { name: "微信原生小程序", value: "mini" }
          // { name: "react", value: "react" }
        ]
      });
    }
  }
  askProjectName(conf, prompts) {
    async function searchNpm(answers) {
      const { framework } = answers;
      console.log(
        chalk.cyan(`正在寻找 ${framework} 远程模板仓库(请耐心等候)...`)
      );
      template = await getBoilerplateMeta(framework);
      console.log(chalk.green("已成功找到模板仓库！"));
      return true;
    }

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
        message: "请输入项目介绍:"
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
