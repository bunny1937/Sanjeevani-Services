// scripts/createuser.js
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "../lib/mongodb.js";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

const createUser = async () => {
  await connectDB(); // ✅ this now connects mongoose correctly

  const existing = await User.findOne({ email: "jaybhawaninehra@gmail.com" });
  if (existing) {
    console.log("⚠️ User already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("ShreeHanuman@1937", 12);
  await User.create({
    email: "jaybhawaninehra@gmail.com",
    password: hashedPassword,
    name: "Tejas",
  });

  console.log("✅ User created");
};

createUser();
