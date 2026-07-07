/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const slateOrigin = "https://ksp-crime-app-60076540751.development.catalystserverless.in";

    return [
      {
        source: "/__catalyst/:path*",
        destination: `${slateOrigin}/__catalyst/:path*`,
      },
      {
        source: "/accounts/:path*",
        destination: `${slateOrigin}/accounts/:path*`,
      },
      {
        source: "/baas/:path*",
        destination: `${slateOrigin}/baas/:path*`,
      },
    ];
  },
};

export default nextConfig;
