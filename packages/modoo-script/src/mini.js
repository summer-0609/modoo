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
      return framework === "mini";
    }
  });

  return prompts;
};
