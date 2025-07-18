// pages/api/services.js
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Service Schema
const ServiceSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    defaultPrice: Number,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Service =
  mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema, "services");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const services = await Service.find({}).lean();

      // Return in the format expected by the frontend
      return res.status(200).json({
        services: services,
      });
    }

    if (req.method === "POST") {
      const service = await Service.create(req.body);
      return res.status(201).json(service);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Services API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
