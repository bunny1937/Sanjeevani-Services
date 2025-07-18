// pages/api/laborers.js
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Laborer Schema
const LaborerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    joiningDate: String,
    daysWorked: Number,
    monthlyPay: Number,
    lastAttendance: String,
    status: String,
  },
  { timestamps: true }
);

const Laborer =
  mongoose.models.Laborer ||
  mongoose.model("Laborer", LaborerSchema, "laborers");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const laborers = await Laborer.find({}).lean();
      return res.status(200).json(laborers);
    }

    if (req.method === "POST") {
      const laborer = await Laborer.create(req.body);
      return res.status(201).json(laborer);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Laborers API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
