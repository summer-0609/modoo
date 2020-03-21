const os = require("os");

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
