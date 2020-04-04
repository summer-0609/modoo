module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserOpts: {
    bodyPattern: /[a-zA-Z]{1}[a-zA-Z0-9]-\d*/,
  },
  /**
   * The configuration array contains:
   * Level [0..2]: 0 disables the rule. For 1 it will be considered a warning for 2 an error.
   * Applicable always|never: never inverts the rule.
   * Value: value to use for this rule.
   */
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'revert', 'chore'],
    ],
    'body-max-length': [2, 'always', 72],
    'body-min-length': [2, 'always', 5],
  },
};
