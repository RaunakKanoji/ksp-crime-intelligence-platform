/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const catalystOrigin =
      process.env.NEXT_PUBLIC_CATALYST_DOMAIN ||
      "https://ksp-crime-app-60076540751.development.catalystserverless.in";

    return [
      {
        source: "/__catalyst/:path*",
        destination: `${catalystOrigin}/__catalyst/:path*`,
      },
      {
        source: "/accounts/:path*",
        destination: `${catalystOrigin}/accounts/:path*`,
      },
      {
        source: "/baas/:path*",
        destination: `${catalystOrigin}/baas/:path*`,
      },
    ];
  },
};

export default nextConfig;
