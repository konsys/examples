/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const ExternalTemplateRemotesPlugin = require('external-remotes-plugin')
const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
require('dotenv').config({ path: './.env' })

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development'
  return {
    target: 'web',
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'cheap-module-source-map' : false,
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.scss', '.svg'],
      alias: {
        '@assets': path.resolve(__dirname, './assets'),
      },
    },
    devServer: {
      //   hot: true,
      static: path.join(__dirname, 'build'),
      port: 3000,

      //   client: {
      //     overlay: {
      //       errors: true,
      //       runtimeErrors: (error) => {
      //         if (
      //           error.message ===
      //           'ResizeObserver loop completed with undelivered notifications.'
      //         ) {
      //           return false
      //         }
      //         return true
      //       },
      //       warnings: false,
      //     },
      //   },
    },
    output: {
      path: path.join(__dirname, '/build'),
      pathinfo: false,
      filename: 'main.js',
      libraryTarget: 'umd',
      publicPath: 'auto',
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.m?js$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            // Creates `style` nodes from JS strings
            'style-loader',
            // Translates CSS into CommonJS
            'css-loader',
            // Compiles Sass to CSS
            'sass-loader',
          ],
        },
        {
          test: /\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$/,
          type: 'asset/resource',
        },
        { test: /\.json$/, type: 'json' },
        {
          test: /\.svg$/,
          use: [
            {
              loader: '@svgr/webpack',
              options: {
                prettier: false,
                svgo: false,
                svgoConfig: {
                  plugins: [{ removeViewBox: false }],
                },
                titleProp: true,
                ref: true,
              },
            },
            {
              loader: 'file-loader',
              options: {
                name: 'static/media/[name].[hash].[ext]',
              },
            },
          ],
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(process.env),
      }),
      new ExternalTemplateRemotesPlugin(),
      new ForkTsCheckerWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/icons8-favicon-32.png',
        publicPath: '/',
      }),
      isDevelopment && new ReactRefreshWebpackPlugin(),
      new ESLintPlugin({
        failOnWarning: true,
        extensions: ['ts', 'tsx'],
        cache: true,
        cacheLocation: 'node_modules/.cache/.eslintcache',
      }),
    ].filter(Boolean),
  }
}
