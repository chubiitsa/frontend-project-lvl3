const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: './src/init.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'init_bundle.js',
    clean: true,
    sourceMapFilename: '[name].js.map',
  },
  devtool: 'source-map',
  module: {
    rules: [
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ]
  },
  plugins: [
    new HtmlWebpackPlugin,
  ],
};