"use strict";

process.on("unhandledRejection", err => {
  throw err;
});

const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const chalk = require("react-dev-utils/chalk");
const { execSync } = require("child_process");
const spawn = require("react-dev-utils/crossSpawn");
const scriptVersion = require("./package").version;

function isInGitRepository() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function isInMercurialRepository() {
  try {
    execSync("hg --cwd . root", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function tryGitInit() {
  try {
    execSync("git --version", { stdio: "ignore" });
    if (isInGitRepository() || isInMercurialRepository()) {
      return false;
    }

    execSync("git init", { stdio: "ignore" });
    return true;
  } catch (e) {
    console.warn("Git repo not initialized", e);
    return false;
  }
}

function tryGitCommit(appPath) {
  try {
    execSync("git add -A", { stdio: "ignore" });
    execSync('git commit -m "Initialize project using Create React App"', {
      stdio: "ignore"
    });
    return true;
  } catch (e) {
    // We couldn't commit in already initialized git repo,
    // maybe the commit author config is not set.
    // In the future, we might supply our own committer
    // like Ember CLI does, but for now, let's just
    // remove the Git files to avoid a half-done state.
    console.warn("Git commit not created", e);
    console.warn("Removing .git directory...");
    try {
      // unlinkSync() doesn't work on directories.
      fs.removeSync(path.join(appPath, ".git"));
    } catch (removeErr) {
      // Ignore.
    }
    return false;
  }
}

function init(appPath, appName, verbose, originalDirectory, templateName) {
  const appPackage = require(path.join(appPath, "package.json"));
  const useYarn = fs.existsSync(path.join(appPath, "yarn.lock"));

  if (!templateName) {
    console.log("");
    console.error(
      `A template was not provided. This is likely because you're using an outdated version of ${chalk.cyan(
        "create-modoo-app"
      )}.`
    );
    console.error(
      `Please note that global installs of ${chalk.cyan(
        "create-modoo-app"
      )} are no longer supported.`
    );
    return;
  }

  const templatePath = path.join(
    require.resolve(templateName, { paths: [appPath] }),
    ".."
  );

  appPackage.scripts = Object.assign(appPackage.scripts, {
    start: "react-scripts start",
    build: "react-scripts build"
  });

  // Update scripts for Yarn users
  if (useYarn) {
    appPackage.scripts = Object.entries(appPackage.scripts).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: value.replace(/(npm run |npm )/, "yarn ")
      }),
      {}
    );
  }

  fs.writeFileSync(
    path.join(appPath, "package.json"),
    JSON.stringify(appPackage, null, 2) + os.EOL
  );

  const readmeExists = fs.existsSync(path.join(appPath, "README.md"));
  if (readmeExists) {
    fs.renameSync(
      path.join(appPath, "README.md"),
      path.join(appPath, "README.old.md")
    );
  }

  // Copy the files for the user
  const templateDir = path.join(templatePath, "template");
  if (fs.existsSync(templateDir)) {
    fs.copySync(templateDir, appPath);
  } else {
    console.error(
      `Could not locate supplied template: ${chalk.green(templateDir)}`
    );
    return;
  }

  if (useYarn) {
    try {
      const readme = fs.readFileSync(path.join(appPath, "README.md"), "utf8");
      fs.writeFileSync(
        path.join(appPath, "README.md"),
        readme.replace(/(npm run |npm )/g, "yarn "),
        "utf8"
      );
    } catch (err) {
      // Silencing the error. As it fall backs to using default npm commands.
    }
  }

  const gitignoreExists = fs.existsSync(path.join(appPath, ".gitignore"));
  if (gitignoreExists) {
    // Append if there's already a `.gitignore` file there
    const data = fs.readFileSync(path.join(appPath, "gitignore"));
    fs.appendFileSync(path.join(appPath, ".gitignore"), data);
    fs.unlinkSync(path.join(appPath, "gitignore"));
  } else {
    // Rename gitignore after the fact to prevent npm from renaming it to .npmignore
    // See: https://github.com/npm/npm/issues/1862
    fs.moveSync(
      path.join(appPath, "gitignore"),
      path.join(appPath, ".gitignore"),
      []
    );
  }

  // Initialize git repo
  let initializedGit = false;

  if (tryGitInit()) {
    initializedGit = true;
    console.log();
    console.log("Initialized a git repository.");
  }

  let command;
  let remove;
  let args;

  if (useYarn) {
    command = "yarnpkg";
    remove = "remove";
    args = ["add"];
  } else {
    command = "npm";
    remove = "uninstall";
    args = ["install", "--save", verbose && "--verbose"].filter(e => e);
  }

  // Remove template
  console.log(`Removing template package using ${command}...`);
  console.log();

  const proc = spawn.sync(command, [remove, templateName], {
    stdio: "inherit"
  });
  if (proc.status !== 0) {
    console.error(`\`${command} ${args.join(" ")}\` failed`);
    return;
  }

  // Create git commit if git repo was initialized
  if (initializedGit && tryGitCommit(appPath)) {
    console.log();
    console.log("Created git commit.");
  }

  let cdpath;
  if (originalDirectory && path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  // Change displayed command to yarn instead of yarnpkg
  const displayedCommand = useYarn ? "yarn" : "npm";

  console.log();
  console.log(`Success! Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(chalk.cyan(`  ${displayedCommand} start`));
  console.log("    Starts the development server.");
  console.log();
  console.log(
    chalk.cyan(`  ${displayedCommand} ${useYarn ? "" : "run "}build`)
  );
  console.log("    Bundles the app into static files for production.");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log(`  ${chalk.cyan(`${displayedCommand} start`)}`);
  if (readmeExists) {
    console.log();
    console.log(
      chalk.yellow(
        "You had a `README.md` file, we renamed it to `README.old.md`"
      )
    );
  }
  console.log();
  console.log(
    chalk.cyan(`摩都娱购电商平台开发部出品 version:${scriptVersion}`)
  );
}

init(
  path.resolve("aa"),
  "aa",
  false,
  process.cwd(),
  "@modoo/modoo-template-mini"
);

console.log(1, process.cwd());
