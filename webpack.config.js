const path = require('path');
const webpack = require('webpack');

var extScript = {
  mode: 'development',
  devtool: 'inline-source-map',
  target: 'web',
  entry: {
    content: './src/ext/content.js',
    background: './src/ext/background.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist/ext'),
    filename: '[name].js'
  },
  module: {
    rules: [
      { test: /manifest.json$/, loader: 'file-loader', type: 'javascript/auto' },
//      { test: /\.css$/, use: [{loader: 'style-loader'}, {loader:  'css-loader'}]},
//      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
//      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
//      { test: /manifest\.json/, loader: "file-loader" },
    ],
  },
}

module.exports = [
  extScript,
]
