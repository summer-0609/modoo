"use strict";

const validateProjectName = require("validate-npm-package-name");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");
const dns = require("dns");
const semver = require("semver");
const os = require("os");
const envinfo = require("envinfo");
const spawn = require("cross-spawn");

const packageJson = require("./package.json");
const { program } = require("commander");
const {
  prompt,
  defaultPackage,
  dependencies,
  devDependencies,
  prettierLintDependencies,
  shouldUseYarn,
  getInstallPackage,
  getTemplateInstallPackage,
  checkThatNpmCanReadCwd
} = require("./utils");

let projectName;

program
  .version(packageJson.version)
  .arguments("<project-directory>")
  .usage(`${chalk.green("<project-directory>")} [options]`)
  .action(name => {
    projectName = name;
  })
  .option("--verbose", "print additional logs")
  .option("--info", "print environment debug info")
  .option(
    "--scripts-version <alternative-package>",
    "use a non-standard version of @modoo/modoo-script"
  )
  .option(
    "--template <path-to-template>",
    "specify a template for the created project"
  )
  .option("--use-npm")
  .allowUnknownOption()
  .on("--help", () => {
    console.log(`    Only ${chalk.green("<project-directory>")} is required.`);
    console.log();
    console.log(
      `    A custom ${chalk.cyan("--scripts-version")} can be one of:`
    );
    console.log(`      - a specific npm version: ${chalk.green("0.8.2")}`);
    console.log(`      - a specific npm tag: ${chalk.green("@next")}`);
    console.log(
      `      - a custom fork published on npm: ${chalk.green(
        "my-modoo-scripts"
      )}`
    );
    console.log(
      `      - a local path relative to the current working directory: ${chalk.green(
        "file:../my-modoo-scripts"
      )}`
    );
    console.log();
    console.log(
      `    If you have any problems, do not hesitate to file an issue:`
    );
    console.log(
      `      ${chalk.cyan("https://github.com/Hyattria/modoo/issues/new")}`
    );
    console.log();
  })
  .parse(process.argv);

if (program.info) {
  console.log(chalk.bold("\nEnvironment Info:"));
  console.log(
    `\n  current version of ${packageJson.name}: ${packageJson.version}`
  );
  console.log(`  running from ${__dirname}`);
  return envinfo
    .run(
      {
        System: ["OS", "CPU"],
        Binaries: ["Node", "npm", "Yarn"],
        Browsers: ["Chrome", "Edge", "Internet Explorer", "Firefox", "Safari"],
        npmPackages: ["react", "react-dom", "react-scripts"],
        npmGlobalPackages: ["create-react-app"]
      },
      {
        duplicates: true,
        showNotFound: true
      }
    )
    .then(console.log);
}

if (typeof projectName === "undefined") {
  console.error("Please specify the project directory:");
  console.log(
    `  ${chalk.cyan(program.name())} ${chalk.green("<project-directory>")}`
  );
  console.log();
  console.log("For example:");
  console.log(`  ${chalk.cyan(program.name())} ${chalk.green("my-modoo-app")}`);
  console.log();
  console.log(
    `Run ${chalk.cyan(`${program.name()} --help`)} to see all options.`
  );
  process.exit(1);
}

// 创建文件夹 + 定义 package.json 基础配置
createApp(
  projectName,
  program.verbose,
  program.scriptsVersion,
  program.useNpm,
  program.template
);

async function createApp(name, verbose, version, useNpm, template) {
  const root = path.resolve(name);
  // 项目名称
  const appName = path.basename(root);

  checkAppName(appName);
  fs.removeSync(name);
  fs.ensureDirSync(name);
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1);
  }
  console.log();

  console.log(`Creating a new React app in ${chalk.green(root)}.`);
  console.log();

  const { _template, ...answer } = await prompt({ template });
  template = _template || template;

  const packageJson = Object.assign(
    {
      name: appName,
      version: "0.1.0",
      description: answer.description,
      private: true,
      license: "MIT",
      scripts: {
        "lint-staged": "lint-staged",
        eslint: "eslint --ext .js src/",
        commit: "git-cz"
      },
      config: {
        commitizen: {
          path: "node_modules/cz-customizable"
        }
      },
      husky: {
        hooks: {
          "pre-commit": "npm run lint-staged",
          "commit-msg": "commitlint -e $GIT_PARAMS"
        }
      }
    },
    defaultPackage(template)
  );

  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  const useYarn = useNpm ? false : shouldUseYarn();
  const originalDirectory = process.cwd();
  process.chdir(root);

  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1);
  }

  run(root, appName, version, verbose, originalDirectory, template, useYarn);
}

function run(
  root,
  appName,
  version,
  verbose,
  originalDirectory,
  template,
  useYarn
) {
  // 需要下载的依赖包
  const packageToInstall = getInstallPackage(template);
  const templateToInstall = getTemplateInstallPackage(template);

  let devsDependencies = [
    ...devDependencies(template),
    ...prettierLintDependencies(template),
    packageToInstall,
    templateToInstall
  ].filter(Boolean);

  console.log("Installing packages. This might take a couple of minutes.");

  checkIfOnline(useYarn)
    .then(isOnline => ({
      isOnline,
      packageInfo: packageToInstall,
      templateInfo: templateToInstall
    }))
    .then(({ isOnline, packageInfo, templateInfo }) => {
      console.log();
      console.log(
        `Installing ${chalk.cyan("react")}, ${chalk.cyan("react-dom")}, and ${
          template === "mini" ? chalk.cyan("gulp") : chalk.cyan(packageInfo)
        }${` with ${chalk.cyan(templateInfo)}`}...`
      );
      console.log();
      dependencies(template).length &&
        dependencies(template).forEach(dep => {
          console.log(`*  ${chalk.cyan(dep)}`);
        });

      console.log("devDependencies");
      devDependencies(template).forEach(dep => {
        console.log(`*  ${chalk.cyan(dep)}`);
      });

      console.log("Prettier dependencies");
      prettierLintDependencies(template).forEach(dep =>
        console.log(`*  ${chalk.cyan(dep)}`)
      );
      console.log();

      return install(
        root,
        useYarn,
        dependencies(template),
        devsDependencies,
        verbose,
        isOnline
      ).then(() => ({ packageInfo, templateInfo }));
    })
    .then(async ({ packageInfo, templateInfo }) => {
      const packageName = packageInfo;
      const templateName = templateInfo;

      checkNodeVersion(packageName);

      const scriptsPath = path.resolve(
        process.cwd(),
        "node_modules",
        packageName,
        "scripts",
        "init.js"
      );
      const init = require(scriptsPath);
      init(root, appName, verbose, originalDirectory, templateName);
    });
}

function install(
  root,
  useYarn,
  dependencies,
  devDependencies,
  verbose,
  isOnline
) {
  return new Promise((resolve, reject) => {
    let command;
    let args = [];
    let argsDev = [];
    if (useYarn) {
      command = "yarnpkg";
      args = ["add", "--exact"];
      argsDev = ["add", "--dev", "--exact"];
      if (!isOnline) {
        args.push("--offline");
        argsDev.push("--offline");
      }

      [].push.apply(args, dependencies);
      [].push.apply(argsDev, devDependencies);

      args.push("--cwd");
      args.push(root);

      argsDev.push("--cwd");
      argsDev.push(root);

      if (!isOnline) {
        console.log(chalk.yellow("You appear to be offline."));
        console.log(chalk.yellow("Falling back to the local Yarn cache."));
        console.log();
      }
    } else {
      command = "npm";
      args = [
        "install",
        "--save",
        "--save-exact",
        "--loglevel",
        "error"
      ].concat(dependencies);

      argsDev = [
        "install",
        "--save-dev",
        "--save-exact",
        "--loglevel",
        "error"
      ].concat(devDependencies);
    }
    if (verbose) {
      args.push("--verbose");
      argsDev.push("--verbose");
    }

    dependencies.length && spawn.sync(command, args, { stdio: "inherit" });
    const child = spawn(command, argsDev, { stdio: "inherit" });
    child.on("close", code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(" ")}`
        });
        return;
      }
      resolve();
    });
  });
}

function checkAppName(appName) {
  const validationResult = validateProjectName(appName);
  if (!validationResult.validForNewPackages) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          `"${appName}"`
        )} because of npm naming restrictions:\n`
      )
    );
    [
      ...(validationResult.errors || []),
      ...(validationResult.warnings || [])
    ].forEach(error => {
      console.error(chalk.red(`  * ${error}`));
    });
    console.error(chalk.red("\nPlease choose a different project name."));
    process.exit(1);
  }

  // TODO: there should be a single place that holds the dependencies
  const dependencies = ["react", "react-dom", "create-modoo-app"].sort();
  if (dependencies.includes(appName)) {
    console.error(
      chalk.red(
        `Cannot create a project named ${chalk.green(
          `"${appName}"`
        )} because a dependency with the same name exists.\n` +
          `Due to the way npm works, the following names are not allowed:\n\n`
      ) +
        chalk.cyan(dependencies.map(depName => `  ${depName}`).join("\n")) +
        chalk.red("\n\nPlease choose a different project name.")
    );
    process.exit(1);
  }
}

function checkNodeVersion(packageName) {
  const packageJsonPath = path.resolve(
    process.cwd(),
    "node_modules",
    packageName,
    "package.json"
  );
  const packageJson = require(packageJsonPath);
  if (!packageJson.engines || !packageJson.engines.node) {
    return;
  }

  if (!semver.satisfies(process.version, packageJson.engines.node)) {
    console.error(
      chalk.red(
        "You are running Node %s.\n" +
          "Create React App requires Node %s or higher. \n" +
          "Please update your version of Node."
      ),
      process.version,
      packageJson.engines.node
    );
    process.exit(1);
  }
}

function isSafeToCreateProjectIn(root, name) {
  const validFiles = [
    ".DS_Store",
    "Thumbs.db",
    ".git",
    ".gitignore",
    ".idea",
    "README.md",
    "LICENSE",
    "web.iml",
    ".hg",
    ".hgignore",
    ".hgcheck",
    ".npmignore",
    "mkdocs.yml",
    "docs",
    ".travis.yml",
    ".gitlab-ci.yml",
    ".gitattributes"
  ];

  const errorLogFilePatterns = [
    "npm-debug.log",
    "yarn-error.log",
    "yarn-debug.log"
  ];

  const conflicts = fs
    .readdirSync(root)
    .filter(file => !validFiles.includes(file))
    // Don't treat log files from previous installation as conflicts
    .filter(
      file => !errorLogFilePatterns.some(pattern => file.indexOf(pattern) === 0)
    );

  if (conflicts.length > 0) {
    console.log(
      `The directory ${chalk.green(name)} contains files that could conflict:`
    );
    console.log();
    for (const file of conflicts) {
      console.log(`  ${file}`);
    }
    console.log();
    console.log(
      "Either try using a new directory name, or remove the files listed above."
    );

    return false;
  }

  // Remove any remnant files from a previous installation
  const currentFiles = fs.readdirSync(path.join(root));
  currentFiles.forEach(file => {
    errorLogFilePatterns.forEach(errorLogFilePattern => {
      // This will catch `(npm-debug|yarn-error|yarn-debug).log*` files
      if (file.indexOf(errorLogFilePattern) === 0) {
        fs.removeSync(path.join(root, file));
      }
    });
  });
  return true;
}

function checkIfOnline(useYarn) {
  if (!useYarn) {
    // Don't ping the Yarn registry.
    // We'll just assume the best case.
    return Promise.resolve(true);
  }
  return new Promise(resolve => {
    dns.lookup("registry.yarnpkg.com", err => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          resolve(proxyErr == null);
        });
      } else {
        resolve(err == null);
      }
    });
  });
}
