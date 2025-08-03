import mongoose from "mongoose";

// Sub-field schema for dynamic fields
const SubFieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["input", "select", "textarea", "number", "checkbox"],
    required: true,
  },
  placeholder: {
    type: String,
    default: "",
  },
  required: {
    type: Boolean,
    default: false,
  },
  options: [
    {
      value: String,
      label: String,
    },
  ], // For select fields
  defaultValue: {
    type: String,
    default: "",
  },
  order: {
    type: Number,
    default: 0,
  },
});

const ServiceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    defaultPrice: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
    scopeOfWork: {
      type: String,
      default: "",
    },
    frequency: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
    },
    // Dynamic sub-fields
    subFields: [SubFieldSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
