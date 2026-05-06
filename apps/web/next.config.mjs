/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Remove basePath if using a custom domain (e.g. kuja7.lk)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  trailingSlash: true, // generates /about/index.html instead of /about.html for GH Pages
  images: {
    unoptimized: true, // required for static export — no server to run the optimizer
  },
}

export default nextConfig
