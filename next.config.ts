import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOADER = path.resolve(__dirname, "src/visual-edits/component-tagger-loader.js");

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  outputFileTracingRoot: path.resolve(__dirname, "../../"),

  allowedDevOrigins: [
    '*.appopen.app',
    'nx-*.appopen.app', 
    '.appopen.app'
  ] as unknown as undefined,

  // ✅ 1. Webpack Loader (normal Next.js dev & build)
  webpack(config) {
    config.module.rules.push({
      test: /\.[jt]sx?$/,
      use: [
        {
          loader: LOADER,
        },
      ],
      exclude: /node_modules/,
    });
    return config;
  },

  // ✅ 2. Turbopack Loader (if using experimental Turbopack)
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [LOADER],
      },
    },
  },
};

export default nextConfig;
