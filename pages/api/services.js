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

      // If requesting service overview with property counts
      if (req.query.overview === "true") {
        // Import Property model
        const PropertySchema = new mongoose.Schema(
          {
            name: String,
            keyPerson: String,
            contact: String,
            location: String,
            area: String,
            serviceType: String,
            amount: Number,
            serviceDate: Date,
            serviceDetails: Object,
            isOnHold: Boolean,
          },
          { timestamps: true }
        );

        const Property =
          mongoose.models.Property ||
          mongoose.model("Property", PropertySchema, "properties");

        // Get all properties
        const properties = await Property.find({}).lean();

        // Create service overview with property counts and details
        const serviceOverview = await Promise.all(
          services.map(async (service) => {
            const serviceProperties = properties.filter(
              (prop) => prop.serviceType === service.name
            );

            return {
              _id: service._id,
              name: service.name,
              description: service.description,
              active: service.active,
              propertyCount: serviceProperties.length,
              properties: serviceProperties.map((prop) => ({
                _id: prop._id,
                name: prop.name,
                keyPerson: prop.keyPerson,
                contact: prop.contact,
                location: prop.location,
                area: prop.area,
                amount: prop.amount,
                serviceDate: prop.serviceDate,
                isOnHold: prop.isOnHold,
                statusDisplay: prop.isOnHold ? "On Hold" : "Active",
              })),
            };
          })
        );

        return res.status(200).json({
          services: services,
          serviceOverview: serviceOverview,
        });
      }

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
