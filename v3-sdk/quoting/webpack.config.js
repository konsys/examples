/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const { ModuleFederationPlugin } = require('webpack').container;
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ExternalTemplateRemotesPlugin = require('external-remotes-plugin');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const deps = require('./package.json').dependencies;
const exposes = require('./exposes.json');
require('dotenv').config({ path: './.env' });

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';
  return {
    target: 'web',
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'cheap-module-source-map' : false,
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.scss', '.svg'],
      alias: {
        '@assets': path.resolve(__dirname, './assets'),
        '@roleContext': path.resolve(__dirname, './src/context'),
      },
    },
    devServer: {
      hot: true,
      static: path.join(__dirname, 'build'),
      port: 8085,
      proxy: [
        {
          context: ['/ui-api-web/cross/calm'],
          target: env.DEV_SERVER || 'http://localhost:8000', // Dev1 стенд - https://calm-core-ui-dev1.oslb-dev01.corp.dev.vtb/
          secure: false,
          cookieDomainRewrite: 'localhost',
          changeOrigin: true,
        },
      ],
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      liveReload: true,
      historyApiFallback: true,
      client: {
        overlay: {
          errors: true,
          runtimeErrors: (error) => {
            if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
              return false;
            }
            return true;
          },
          warnings: false,
        },
      },
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
      new ModuleFederationPlugin({
        name: 'calc',
        filename: 'remoteEntry.js',
        exposes,
        remotes: {},
        shared: {
          ...deps,
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
          'react-router-dom': {
            singleton: true,
            requiredVersion: deps['react-router-dom'],
          },
          'styled-components': {
            singleton: true,
            requiredVersion: deps['styled-components'],
          },
          axios: {
            singleton: true,
            requiredVersion: deps.axios,
          },
          i18next: {
            singleton: true,
            requiredVersion: deps.i18next,
          },
          'react-i18next': {
            singleton: true,
            requiredVersion: deps['react-i18next'],
          },
          antd: {
            singleton: true,
            requiredVersion: deps.antd,
          },
          'react-redux': {
            singleton: true,
            requiredVersion: deps['react-redux'],
          },
          '@reduxjs/toolkit': {
            singleton: true,
            requiredVersion: deps['@reduxjs/toolkit'],
          },
          'react-hook-form': {
            singleton: true,
            requiredVersion: deps['react-hook-form'],
          },
          '@tanstack/react-query': {
            singleton: true,
            requiredVersion: deps['@tanstack/react-query'],
          },
          '@admiral-ds/flags': {
            requiredVersion: deps['@admiral-ds/flags'],
          },
          '@admiral-ds/icons': {
            requiredVersion: deps['@admiral-ds/icons'],
          },
          '@admiral-ds/fonts': {
            requiredVersion: deps['@admiral-ds/fonts'],
          },
          '@admiral-ds/react-ui': {
            requiredVersion: deps['@admiral-ds/react-ui'],
          },
        },
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: './public/config.js',
            to: './',
          },
        ],
      }),
      new webpack.DefinePlugin({
        'process.env': JSON.stringify(process.env),
      }),
      new ExternalTemplateRemotesPlugin(),
      new ForkTsCheckerWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        chunks: ['main'],
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
  };
};
