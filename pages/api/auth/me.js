// pages/api/auth/me.js
import { getServerSession } from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req);

    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    res.status(200).json({ user: session.user });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
