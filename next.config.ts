import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
};
export default config;
