import type { NextConfig } from "next"

// Statische export voor GitHub Pages (project-site op /leenlog).
const repo = "leenlog"

const nextConfig: NextConfig = {
  output: "export",
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
