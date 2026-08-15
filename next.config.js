/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdf-parse relies on Node APIs, so it must stay out of the client bundle
  // and run only inside the server-side API route.
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

module.exports = nextConfig;
