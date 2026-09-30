/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: '/dashboard/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
