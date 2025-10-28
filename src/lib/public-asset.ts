const assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Resolves a path in the Next.js public folder so it works with deployments under a basePath.
 */
export function publicAsset(path: `/${string}`) {
  return `${assetPrefix}${path}`;
}

