const path = require('path')

module.exports = {
  entry: './visualizer/index.js',
  output: {
    path: path.resolve(__dirname, 'visualizer', 'dist'),
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'visualizer', 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  devtool: "inline-source-map"
}
