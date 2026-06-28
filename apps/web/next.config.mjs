/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Nginx serves the static export from /app/out (see Dockerfile)
  // Remove basePath if using a custom domain (e.g. kuja7.lk)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  trailingSlash: true, // /login/ → /login/index.html for nginx static serving
  images: {
    unoptimized: true, // required for static export — no server to run the optimizer
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
