"use strict";

const path = require("path");
const webpack = require("webpack");

const TerserPlugin = require("terser-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const safePostCssParser = require("postcss-safe-parser");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const ProgressBarPlugin = require("progress-bar-webpack-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const WatchMissingNodeModulesPlugin = require("react-dev-utils/WatchMissingNodeModulesPlugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const paths = require("./paths");
const getClientEnvironment = require("./env");
const modules = require("./modules");

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
const isExtendingEslintConfig = process.env.EXTEND_ESLINT === "true";

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || "10000"
);

module.exports = function(webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  return {
    mode: webpackEnv,
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? "source-map"
        : false
      : isEnvDevelopment && "cheap-module-source-map",
    entry: [
      isEnvDevelopment &&
        require.resolve("react-dev-utils/webpackHotDevClient"),
      paths.appIndexJs
    ].filter(Boolean),
    output: {
      path: isEnvProduction ? paths.appBuild : undefined,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction
        ? "static/js/[name].[contenthash:8].js"
        : isEnvDevelopment && "static/js/bundle.js",
      // TODO: remove this when upgrading to webpack 5
      futureEmitAssets: true,
      chunkFilename: isEnvProduction
        ? "static/js/[name].[contenthash:8].chunk.js"
        : isEnvDevelopment && "static/js/[name].chunk.js",
      publicPath: paths.publicUrlOrPath,
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, "/")
        : isEnvDevelopment &&
          (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"))
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2
            },
            mangle: {
              safari10: true
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          },
          sourceMap: shouldUseSourceMap,
          parallel: true,
          cache: true
        }),
        // This is only used in production mode
        new OptimizeCSSAssetsPlugin({
          cssProcessorOptions: {
            parser: safePostCssParser,
            map: shouldUseSourceMap
              ? {
                  inline: false,
                  annotation: true
                }
              : false
          },
          cssProcessorPluginOptions: {
            preset: ["default", { minifyFontValues: { removeQuotes: false } }]
          }
        })
      ],
      splitChunks: {
        chunks: "all",
        name: false
      },
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`
      }
    },
    resolve: {
      modules: ["node_modules", paths.appNodeModules].concat(
        modules.additionalModulePaths || []
      ),
      extensions: [".web.js", ".mjs", ".js", ".json", ".web.jsx", ".jsx"],
      alias: {
        ...(modules.webpackAliases || {})
      },
      plugins: [new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson])]
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        { parser: { requireEnsure: false } },
        // It's important to do this before Babel processes the JS.
        {
          test: /\.(js|jsx|mjs)$/,
          enforce: "pre",
          use: [
            {
              options: {
                cache: true,
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                resolvePluginsRelativeTo: __dirname,
                // @remove-on-eject-begin
                ignore: isExtendingEslintConfig,
                baseConfig: isExtendingEslintConfig
                  ? undefined
                  : {
                      extends: [
                        require.resolve("@modoo/eslint-config-modoo-app")
                      ]
                    },
                useEslintrc: isExtendingEslintConfig
              },
              loader: require.resolve("eslint-loader")
            }
          ],
          include: paths.appSrc
        },
        {
          oneOf: [
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              loader: require.resolve("url-loader"),
              options: {
                limit: imageInlineSizeLimit,
                name: "static/media/[name].[hash:8].[ext]"
              }
            },
            {
              test: /\.(js|jsx)$/,
              include: paths.appSrc,
              exclude: [/[/\\\\]node_modules[/\\\\]/],
              use: [
                {
                  loader: require.resolve("babel-loader"),
                  options: {
                    babelrc: false,
                    configFile: false,
                    plugins: [
                      [
                        require.resolve("babel-plugin-import"),
                        {
                          libraryName: "antd",
                          libraryDirectory: "es",
                          style: "css"
                        }
                      ],
                      [require.resolve("babel-plugin-styled-components")],
                      [
                        require.resolve("babel-plugin-named-asset-import"),
                        {
                          loaderMap: {
                            svg: {
                              ReactComponent:
                                "@svgr/webpack?-prettier,-svgo![path]"
                            }
                          }
                        }
                      ]
                    ],
                    presets: [
                      [
                        require.resolve("@babel/preset-env"),
                        {
                          // We want Create React App to be IE 9 compatible until React itself
                          // no longer works with IE 9
                          targets: {
                            ie: 9
                          },
                          // Users cannot override this behavior because this Babel
                          // configuration is highly tuned for ES5 support
                          ignoreBrowserslistConfig: true,
                          // If users import all core-js they're probably not concerned with
                          // bundle size. We shouldn't rely on magic to try and shrink it.
                          useBuiltIns: false,
                          // Do not transform modules to CJS
                          modules: false,
                          // Exclude transforms that make all code slower
                          exclude: ["transform-typeof-symbol"]
                        }
                      ],
                      [
                        require.resolve("@babel/preset-react"),
                        {
                          useBuiltIns: true
                        }
                      ]
                    ],
                    cacheDirectory: true,
                    highlightCode: true,
                    cacheCompression: false,
                    compact: isEnvProduction
                  }
                }
              ]
            },
            {
              test: /\.css$/,
              exclude: /\.module\.css$/,
              loader: [
                MiniCssExtractPlugin.loader,
                {
                  loader: require.resolve("css-loader"),
                  options: {
                    importLoaders: 1,
                    sourceMap: shouldUseSourceMap
                  }
                }
              ]
            },
            {
              loader: require.resolve("file-loader"),
              exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
              options: {
                name: "static/media/[name].[hash:8].[ext]"
              }
            }
          ]
        }
      ]
    },
    plugins: [
      new ProgressBarPlugin(),
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml
          },
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true
                }
              }
            : undefined
        )
      ),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      new ModuleNotFoundPlugin(paths.appPath),
      new webpack.DefinePlugin(env.stringified),
      // path 大小写变化时无需重启 webpack
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      // npm 安装新依赖无需重启 webpack
      isEnvDevelopment &&
        new WatchMissingNodeModulesPlugin(paths.appNodeModules),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "static/css/[name].[contenthash:8].css",
          chunkFilename: "static/css/[name].[contenthash:8].chunk.css"
        }),
      new ManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            fileName => !fileName.endsWith(".map")
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles
          };
        }
      }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ].filter(Boolean),
    node: {
      dgram: "empty",
      fs: "empty",
      net: "empty",
      tls: "empty",
      child_process: "empty"
    },
    performance: false
  };
};
