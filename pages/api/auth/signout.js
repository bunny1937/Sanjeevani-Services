// pages/api/auth/signout.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Clear the auth cookie
  res.setHeader("Set-Cookie", [
    "auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict",
  ]);

  res.status(200).json({ message: "Signed out successfully" });
}
