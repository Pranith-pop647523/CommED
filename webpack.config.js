const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', 
  entry: './js/app.js', // entry piont

  output: {
    path: path.resolve(__dirname, 'dist'), 
    filename: 'bundle.js', // Output bundle
    clean: true, // Clean the output directory before emit
  },

  // Development server configuration
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    open: true, // Open the default browser
    hot: true, 
    host: 'localhost', 
    port: 8090, 
    historyApiFallback: true, // Fallback to index.html for Single Page Applications.
  },

  // Loaders and rules
  module: {
    rules: [
      {
        test: /\.js$/, 
        exclude: /node_modules/, 
        use: {
          loader: 'babel-loader', // Use Babel loader
          options: {
            presets: ['@babel/preset-env'], // Use the preset-env Babel preset
          },
        },
      },
      {
        test: /\.css$/, 
        use: ['style-loader', 'css-loader'], 
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader', 
          'css-loader',   
          'sass-loader'   // idk why i have this but sca5ed to remove
        ]
      },
   
    ],
  },

  // Plugins
  plugins: [
    new HtmlWebpackPlugin({
      title: 'CommED', 
      filename: 'index.html', // Output HTML file
      template: './index.html', // Path to the template HTML file
    }),
  ],
};
