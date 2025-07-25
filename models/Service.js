import mongoose from "mongoose";

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
    scopeOfWork: { String }, // New field for detailed service description
    frequency: { String }, // New field for service frequency
    notes: { String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);
