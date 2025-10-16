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
  output: "export",
  distDir: "out",
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

module.exports = nextConfig;
