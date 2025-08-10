// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    allowedDevOrigins: ["http://localhost:3000"], // ✅ should be strings
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("bcryptjs");
    }
    return config;
  },
};

export default nextConfig;
