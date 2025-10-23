const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(isGitHubActions && repoName
    ? {
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`
      }
    : {}),
  env: {
    NEXT_PUBLIC_NOVA_API_URL: process.env.NEXT_PUBLIC_NOVA_API_URL,
    NEXT_PUBLIC_NOVA_API_KEY: process.env.NEXT_PUBLIC_NOVA_API_KEY
  },
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

module.exports = nextConfig;
