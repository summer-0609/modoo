const path = require('path');

module.exports = {
  parser: 'postcss-less',
  plugins: {
    'postcss-partial-import': {
      path: [path.resolve(__dirname, 'src')],
    },
    'postcss-font-base64': {}, // font to base64
    'postcss-url': {
      url: 'inline', // inline image to base64
    },
  },
};
