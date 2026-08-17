const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/busserz";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.NEXT_PUBLIC_STATIC_EXPORT === "true" ? { output: "export" } : {}),
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath,
  assetPrefix: basePath,
};

export default nextConfig;