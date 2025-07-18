// pages/api/debug.js
export default async function handler(req, res) {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const nodeEnv = process.env.NODE_ENV;

    return res.status(200).json({
      mongoUri: mongoUri ? "URI is set" : "URI is missing",
      nodeEnv,
      allEnvKeys: Object.keys(process.env).filter((key) =>
        key.includes("MONGO")
      ),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Debug error",
      error: error.message,
    });
  }
}
