import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  compiler: {
    removeConsole: false,
  },
};

export default nextConfig;
