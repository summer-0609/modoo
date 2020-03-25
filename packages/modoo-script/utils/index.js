const os = require("os");
const fs = require("fs");
const chalk = require("chalk");
const globby = require("globby");
const path = require("path");

const { execSync } = require("child_process");

exports.getUserHomeDir = function() {
  function homedir() {
    const env = process.env;
    const home = env.HOME;
    const user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

    if (process.platform === "win32") {
      return env.USERPROFILE || "" + env.HOMEDRIVE + env.HOMEPATH || home || "";
    }
    if (process.platform === "darwin") {
      return home || (user ? "/Users/" + user : "");
    }
    if (process.platform === "linux") {
      return (
        home || (process.getuid() === 0 ? "/root" : user ? "/home/" + user : "")
      );
    }
    return home || "";
  }
  return typeof os.homedir === "function" ? os.homedir() : homedir();
};

// 渲染二进制图
exports.renderAscii = () => {
  const ascii = fs.readFileSync(
    path.resolve(__dirname, "../resource/ascii-modoojs.txt")
  );
  console.log("");
  console.log(chalk.green(ascii));
  console.log("");
};

exports.template = (content = "", inject) => {
  return content.replace(/@{([^}]+)}/gi, (m, key) => {
    return inject[key.trim()];
  });
};

// 递归读文件
exports.readFiles = (dir, options, done) => {
  if (!fs.existsSync(dir)) {
    throw new Error(`The file ${dir} does not exist.`);
  }
  if (typeof options === "function") {
    done = options;
    options = {};
  }
  options = Object.assign(
    {},
    {
      cwd: dir,
      dot: true,
      absolute: true,
      onlyFiles: true
    },
    options
  );

  const files = globby.sync("**/**", options);
  files.forEach(file => {
    done({
      path: file,
      content: fs.readFileSync(file, { encoding: "utf8" })
    });
  });
};

// yarn
exports.shouldUseYarn = () => {
  try {
    execSync("yarn --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
};

// cnpm
exports.shouldUseCnpm = () => {
  try {
    execSync("cnpm --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
};
