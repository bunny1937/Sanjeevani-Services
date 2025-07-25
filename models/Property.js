import mongoose from "mongoose";

const PropertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    keyPerson: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    serviceType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    lastService: {
      type: String,
      required: true,
    },
    autoGenerateReminders: {
      type: Boolean,
      default: true, // Default to true for existing properties
    },
    serviceDate: { type: Date, required: false, default: null },
    isOnHold: { type: Boolean, default: false },
    contractDuration: { type: String, default: "1 Year" }, // New field for contract duration
    discountPercentage: { type: Number, default: 0 }, // New field for discount
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Property ||
  mongoose.model("Property", PropertySchema);
