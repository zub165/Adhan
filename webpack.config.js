const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/Adhan/' : '/';

module.exports = {
  entry: './js/modules/app-init.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    // Use relative path for the bundle
    publicPath: ''  // Empty string for relative paths
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      inject: true,
      // Add script tags for external libraries
      scripts: [
        {
          src: 'https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js',
          type: 'text/javascript'
        }
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'adhans',
          to: 'adhans',
          noErrorOnMissing: true,
          globOptions: {
            ignore: ['**/.DS_Store', '**/Thumbs.db']
          }
        },
        {
          from: 'css',
          to: 'css',
          noErrorOnMissing: true
        },
        {
          from: 'assets',
          to: 'assets',
          noErrorOnMissing: true
        },
        {
          from: 'js/modules/adhan.js',
          to: 'js/modules/adhan.js',
          noErrorOnMissing: true
        }
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.BASE_PATH': JSON.stringify(isProduction ? '/Adhan' : '')
    }),
    // Add a plugin to inject the Adhan script
    {
      apply: (compiler) => {
        compiler.hooks.compilation.tap('AddAdhanScript', (compilation) => {
          HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
            'AddAdhanScript',
            (data, cb) => {
              // Add the Adhan script before the bundle script
              data.html = data.html.replace(
                '</head>',
                '<script src="https://cdn.jsdelivr.net/npm/adhan@4.4.3/dist/adhan.min.js"></script></head>'
              );
              cb(null, data);
            }
          );
        });
      }
    }
  ],
  resolve: {
    extensions: ['.js']
  },
  performance: {
    hints: false,
    maxAssetSize: 10000000, // 10MB
    maxEntrypointSize: 10000000 // 10MB
  },
  devServer: {
    static: {
      directory: path.join(__dirname, '/')
    },
    compress: true,
    port: 9000,
    hot: true,
    historyApiFallback: true
  }
}; 