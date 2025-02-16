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
};

export default nextConfig;
