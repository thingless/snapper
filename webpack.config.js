const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require("copy-webpack-plugin");

var extScript = {
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'web',
  entry: {
    content: './src/ext/content.js',
    background: './src/ext/background.js',
    options: './src/ext/options.js',
    popup: './src/ext/popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist/ext'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/ext/manifest.json" },
      ]
    })
  ],
  module: {
    rules: [
      { test: /\.css$/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
    ],
  },
}

module.exports = [
  extScript,
]
