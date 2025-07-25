// pages/api/services/[id].js
import connectDB from "../../../lib/mongodb.js";
import mongoose from "mongoose";

// Service Schema (same as above)
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
  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === "PUT") {
      const { name, description, active } = req.body;

      // Validate required fields
      if (!name || !description) {
        return res.status(400).json({
          message: "Name and description are required",
        });
      }

      const service = await Service.findByIdAndUpdate(
        id,
        {
          name,
          description,
          active: active !== undefined ? active : true,
        },
        { new: true, runValidators: true }
      );

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      return res.status(200).json(service);
    }

    if (req.method === "DELETE") {
      const service = await Service.findByIdAndDelete(id);

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      return res.status(200).json({
        message: "Service deleted successfully",
        deletedService: service,
      });
    }

    if (req.method === "GET") {
      const service = await Service.findById(id).lean();

      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }

      return res.status(200).json(service);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Service API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
