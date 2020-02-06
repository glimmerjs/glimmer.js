const path = require('path');

module.exports = {
  mode: 'development',
  externals: {
    fs: 'fs',
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        include: [path.resolve(__dirname, 'src')],
        use: ['babel-loader'],
      },
    ],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
};
