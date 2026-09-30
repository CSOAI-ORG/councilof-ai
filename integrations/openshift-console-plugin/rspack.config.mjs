// Modelled on openshift/console-plugin-template (main, read 30 Sep 2026): no regular entry points;
// ConsoleRemotePlugin generates plugin-entry.js and plugin-manifest.json from package.json
// "consolePlugin" and console-extensions.json.
import path from "node:path";
import { fileURLToPath } from "node:url";
import rspack from "@rspack/core";
import { ConsoleRemotePlugin } from "@openshift-console/dynamic-plugin-sdk-webpack";

const here = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

export default {
  mode: isProd ? "production" : "development",
  context: path.resolve(here, "src"),
  entry: {},
  output: {
    path: path.resolve(here, "dist"),
    filename: isProd ? "[name]-bundle-[contenthash].min.js" : "[name]-bundle.js",
    chunkFilename: isProd ? "[name]-chunk-[chunkhash].min.js" : "[name]-chunk.js",
  },
  resolve: { extensions: [".ts", ".tsx", ".js", ".jsx"] },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        loader: "builtin:swc-loader",
        options: { jsc: { parser: { syntax: "typescript", tsx: true }, transform: { react: { runtime: "classic" } }, target: "es2021" } },
      },
      { test: /\.css$/, type: "css" },
    ],
  },
  experiments: { css: true },
  devServer: {
    static: "./dist",
    port: 9001,
    allowedHosts: "all",
    headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "X-Requested-With, Content-Type, Authorization" },
    devMiddleware: { writeToDisk: true },
  },
  plugins: [
    new ConsoleRemotePlugin(),
    new rspack.CopyRspackPlugin({ patterns: [{ from: path.resolve(here, "locales"), to: "locales" }, { from: path.resolve(here, "standalone"), to: "standalone" }] }),
  ],
  devtool: isProd ? false : "source-map",
  optimization: { chunkIds: isProd ? "deterministic" : "named", minimize: isProd },
};
