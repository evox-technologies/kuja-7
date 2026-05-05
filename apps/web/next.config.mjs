/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'matrimony-assets.sgp1.cdn.digitaloceanspaces.com',
      },
    ],
  },
}

export default nextConfig
