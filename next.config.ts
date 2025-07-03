
const nextConfig = {
  allowedDevOrigins: [process.env.REPLIT_DOMAINS?.split(",")[0]],
};

module.exports = nextConfig;
