const inquirer = require("inquirer");
const { execSync } = require("child_process");

const FRAMEWORK_CONFIG_JSON = {
  mini: {
    packageJson: {
      scripts: {
        "gulp:dev": "gulp dev",
        start: "cross-env NODE_ENV=development yarn gulp:dev",
        build: "cross-env NODE_ENV=production gulp build",
        "lint-staged": "lint-staged",
        "lint-staged:js": "eslint --ext .js src/",
        commit: "git-cz",
      },
    },
    installPackage: "@modoo/modoo-script",
    template: "@modoo/modoo-template-mini",
    prettierLintDependencies: [
      "@commitlint/cli",
      "@commitlint/config-conventional",
      "cz-conventional-changelog",
      "cz-customizable",
      "husky",
      "lint-staged",
      "prettier",
    ],
    devDependencies: [
      "autoprefixer",
      "babel-eslint",
      "chalk",
      "commitizen",
      "cross-env",
      "del",
      "eslint",
      "eslint-config-imweb",
      "gulp",
      "gulp-cache",
      "gulp-htmlmin",
      "gulp-jsonminify2",
      "gulp-less",
      "gulp-postcss",
      "gulp-purifycss",
      "gulp-rename",
      "ora",
      "postcss-font-base64",
      "postcss-less",
      "postcss-partial-import",
      "postcss-url",
      "stylelint",
      "stylelint-config-prettier",
      "stylelint-config-standard",
    ],
  },
  react: {
    packageJson: {
      scripts: {
        "lint-staged": "lint-staged",
        "lint-staged:js": "eslint --ext .js src/",
        commit: "git-cz",
      },
    },
    installPackage: "@modoo/modoo-script",
    template: "@modoo/modoo-template-react",
    prettierLintDependencies: [
      "@commitlint/cli",
      "@commitlint/config-conventional",
      "cz-conventional-changelog",
      "cz-customizable",
      "husky",
      "lint-staged",
      "prettier",
    ],
    dependencies: ["react", "react-dom", "dva", "antd"],
  },
};

function prompt({ template }) {
  // 询问用户
  let promptList = [
    {
      type: "list",
      name: "template",
      message: "please choose this project template",
      choices: [
        {
          name: "React",
          value: "react",
        },
        {
          name: "原生微信小程序",
          value: "mini",
        },
      ],
      when: () => !template,
    },
    {
      type: "input",
      name: "description",
      message: "Please enter the project description: ",
    },
    {
      type: "input",
      name: "appId",
      message: "Please enter the appId:",
      validate(input) {
        if (!input) {
          return "appId is required";
        }
        return true;
      },
      when(answer) {
        return (answer.template || template) === "mini";
      },
    },
  ];
  return new Promise((resolve) => {
    inquirer.prompt(promptList).then((answer) => {
      resolve(answer);
    });
  });
}

function defaultPackage(template) {
  return FRAMEWORK_CONFIG_JSON[template].packageJson;
}

function getInstallPackage(template) {
  return FRAMEWORK_CONFIG_JSON[template].installPackage;
}

function devDependencies(template) {
  return FRAMEWORK_CONFIG_JSON[template].devDependencies || [];
}

function prettierLintDependencies(template) {
  return FRAMEWORK_CONFIG_JSON[template].prettierLintDependencies || [];
}

function dependencies(template) {
  return FRAMEWORK_CONFIG_JSON[template].dependencies || [];
}

function getTemplateInstallPackage(template) {
  return FRAMEWORK_CONFIG_JSON[template].template;
}

function shouldUseYarn() {
  try {
    execSync("yarnpkg --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function checkThatNpmCanReadCwd() {
  const cwd = process.cwd();
  let childOutput = null;
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync("npm", ["config", "list"]).output.join("");
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true;
  }
  if (typeof childOutput !== "string") {
    return true;
  }
  const lines = childOutput.split("\n");
  // `npm config list` output includes the following line:
  // "; cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = "; cwd = ";
  const line = lines.find((line) => line.startsWith(prefix));
  if (typeof line !== "string") {
    // Fail gracefully. They could remove it.
    return true;
  }
  const npmCWD = line.substring(prefix.length);
  if (npmCWD === cwd) {
    return true;
  }
  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`
    )
  );
  if (process.platform === "win32") {
    console.error(
      chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${chalk.cyan(
          "reg"
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          "reg"
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        chalk.red(`Try to run the above two lines in the terminal.\n`) +
        chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
        )
    );
  }
  return false;
}

module.exports = {
  prompt,
  defaultPackage,
  dependencies,
  devDependencies,
  prettierLintDependencies,
  getInstallPackage,
  getTemplateInstallPackage,
  shouldUseYarn,
  checkThatNpmCanReadCwd,
};
