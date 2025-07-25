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
      const { name, description, active } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({
          message: "Name and description are required",
        });
      }

      const service = await Service.create({
        name,
        description,
        active: active !== undefined ? active : true,
      });

      return res.status(201).json(service);
    }

    if (req.method === "PUT") {
      const { name, description, active } = req.body;

      // For PUT requests, you'll need to create a dynamic route [id].js
      // This is just showing the structure
      return res.status(405).json({
        message: "PUT requests should be made to /api/services/[id]",
      });
    }

    if (req.method === "DELETE") {
      // For DELETE requests, you'll need to create a dynamic route [id].js
      return res.status(405).json({
        message: "DELETE requests should be made to /api/services/[id]",
      });
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
