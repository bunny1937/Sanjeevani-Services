// lib/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectDB from "./mongodb";
import User from "../models/User";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId, email, name) => {
  return jwt.sign({ userId, email, name }, JWT_SECRET, { expiresIn: "24h" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const getServerSession = async (req) => {
  try {
    const token = req.cookies.auth_token;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password");

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
    };
  } catch (error) {
    console.error("Session verification error:", error);
    return null;
  }
};
