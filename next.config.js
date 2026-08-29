const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jactbb.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // face-api.js pulls in tfjs-core's Node fetch fallback, which optionally
    // requires 'encoding' — unused in the browser bundle we actually ship.
    config.resolve.fallback = { ...config.resolve.fallback, encoding: false, fs: false };
    return config;
  },
};

export default nextConfig;
