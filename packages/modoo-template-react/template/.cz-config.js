'use strict';

module.exports = {
  types: [
    {
      value: 'feat',
      name: '✨  feat:     新增功能',
    },
    {
      value: 'fix',
      name: '🐞  fix:      修复 bug',
    },
    {
      value: 'refactor',
      name: '🛠  refactor: 代码重构，没有加新功能或者修复 bug',
    },
    {
      value: 'docs',
      name: '📚  docs:     仅仅修改了文档，比如 README、CHANGELOG、CONTRIBUTE 等等',
    },
    {
      value: 'test',
      name: '🏁  test:     测试用例，包括单元测试、集成测试等',
    },
    {
      value: 'chore',
      name: '🗯  chore:    改变构建流程、或者增加依赖库、工具等',
    },
    {
      value: 'style',
      name: '💅  style:    仅仅修改了空格、格式缩进、都好等等，不改变代码逻辑',
    },
    {
      value: 'revert',
      name: '⏪  revert:   回滚到上一个版本',
    },
  ],

  scopes: ['*', 'config', 'components', 'pages', 'utils', 'styles'],

  allowCustomScopes: true,
  allowBreakingChanges: ['feat', 'fix'],
};
