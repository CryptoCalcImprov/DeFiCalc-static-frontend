const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1];
const novaDevProxyTarget = process.env.NOVA_DEV_PROXY_TARGET?.trim();

/** @type {(phase: string) => import('next').NextConfig} */
module.exports = function nextConfig(phase) {
  const basePath = isGitHubActions && repoName ? `/${repoName}` : "";

  const config = {
    ...(basePath
      ? {
          basePath,
          assetPrefix: `${basePath}/`
        }
      : {}),
    env: {
      NEXT_PUBLIC_BASE_PATH: basePath
    },
    output: "export",
    distDir: "out",
    images: {
      unoptimized: true
    },
    trailingSlash: true
  };

  if (phase === PHASE_DEVELOPMENT_SERVER && novaDevProxyTarget) {
    const sanitizedTarget = novaDevProxyTarget.endsWith("/ai")
      ? novaDevProxyTarget
      : `${novaDevProxyTarget.replace(/\/$/, "")}/ai`;

    config.rewrites = async () => [
      {
        source: "/ai",
        destination: sanitizedTarget
      }
    ];

    // Increase timeout for dev server requests (handles long image generation)
    config.experimental = {
      ...config.experimental,
      proxyTimeout: 300000, // 5 minutes in milliseconds
    };
  }

  return config;
};
