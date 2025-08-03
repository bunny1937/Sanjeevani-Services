// pages/api/services.js
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Sub-field schema for dynamic fields
const SubFieldSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: {
    type: String,
    enum: ["input", "select", "textarea", "number", "checkbox"],
  },
  placeholder: String,
  required: Boolean,
  options: [
    {
      value: String,
      label: String,
    },
  ],
  defaultValue: String,
  order: Number,
});

// Service Schema
const ServiceSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    defaultPrice: Number,
    active: { type: Boolean, default: true },
    scopeOfWork: String,
    frequency: String,
    notes: String,
    subFields: [SubFieldSchema],
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
      return res.status(200).json({
        services: services,
      });
    }

    if (req.method === "POST") {
      const {
        name,
        description,
        active,
        scopeOfWork,
        frequency,
        notes,
        subFields,
      } = req.body;

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
        scopeOfWork: scopeOfWork || "",
        frequency: frequency || "",
        notes: notes || "",
        subFields: subFields || [],
      });

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
