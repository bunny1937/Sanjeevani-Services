// pages/api/services/[id].js
import connectDB from "../../../lib/mongodb.js";
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
  const { id } = req.query;

  try {
    await connectDB();

    if (req.method === "PUT") {
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

      // Validate subFields if provided
      if (subFields && Array.isArray(subFields)) {
        for (const field of subFields) {
          if (!field.label || !field.type) {
            return res.status(400).json({
              message: "Each sub-field must have a label and type",
            });
          }

          // Validate field type
          if (
            !["input", "select", "textarea", "number", "checkbox"].includes(
              field.type
            )
          ) {
            return res.status(400).json({
              message: `Invalid field type: ${field.type}`,
            });
          }

          // Validate select options
          if (
            field.type === "select" &&
            (!field.options ||
              !Array.isArray(field.options) ||
              field.options.length === 0)
          ) {
            return res.status(400).json({
              message: `Select field '${field.label}' must have at least one option`,
            });
          }
        }
      }

      const service = await Service.findByIdAndUpdate(
        id,
        {
          name,
          description,
          active: active !== undefined ? active : true,
          scopeOfWork: scopeOfWork || "",
          frequency: frequency || "",
          notes: notes || "",
          subFields: subFields || [],
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

    // Handle MongoDB validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    // Handle MongoDB cast errors (invalid ObjectId)
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid service ID format",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
