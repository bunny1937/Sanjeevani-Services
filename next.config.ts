// next.config.ts
const nextConfig = {
  experimental: {
    allowedDevOrigins: ["http://localhost:3000"], // ✅ should be strings
  },
};

export default nextConfig;
