const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
        index: ['@babel/polyfill', './assets/js/index.js'],
        tool: ['@babel/polyfill', './assets/js/tool.js'],
        history: ['@babel/polyfill', './assets/js/history.js'],
        blog: ['@babel/polyfill', './assets/js/blog.js']
    },
    devServer: {
        contentBase: './dist'
    },
    devtool: 'inline-source-map',
    output: {
      filename: '[name].min.js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            // 'style-loader',
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
            test: /\.js$/,
            include: path.resolve(__dirname, 'assets/js'),
            exclude: /(node_modules)|(dist)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            }
        },
        {
          test: /\.(jpe?g|png|gif|svg|otf|ttf)$/i, 
          loader: "file-loader?name=/assets/[name].[ext]"
        }
      ]
    },
    optimization: {
      minimizer: [
        new OptimizeCssAssetsPlugin(),
        new TerserPlugin()
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
          filename: 'login.html',
          template: './templates/login.html',
          inject: false
      }),
      new HtmlWebpackPlugin({
        filename: 'tool.html',
        template: './templates/tool.html',
        inject: false
      }),
      new HtmlWebpackPlugin({
        filename: 'history.html',
        template: './templates/history.html',
        inject: false
      }),
      new HtmlWebpackPlugin({
        filename: 'blog.html',
        template: './templates/blog.html',
        inject: false
      }),
      new MiniCssExtractPlugin({filename: '[name].min.css'})
    ]
  };