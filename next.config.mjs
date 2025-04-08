/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Make sure images and assets work correctly on Vercel
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
    unoptimized: true,
  },
  // Ensure proper handling of static assets
  swcMinify: true,
};

export default nextConfig;
