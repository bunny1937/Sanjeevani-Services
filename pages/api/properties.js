// pages/api/properties.js - Updated with DELETE functionality
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Property Schema - Updated with serviceDetails
const PropertySchema = new mongoose.Schema(
  {
    name: String,
    keyPerson: String,
    contact: String,
    location: String,
    area: String,
    serviceType: String,
    amount: Number,
    serviceDate: { type: Date, required: true },
    serviceDetails: {
      // Water Tank Cleaning fields
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: Number,
      wing: String,
      // Pest Control fields
      treatment: String,
      apartment: String,
      // Motor Repairing fields
      workDescription: String,
    },
  },
  { timestamps: true }
);

// SIMPLIFIED Reminder Schema - only scheduledDate
const ReminderSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    propertyName: { type: String, required: true },
    keyPerson: { type: String, required: true },
    contact: { type: String, required: true },
    location: { type: String, required: true },
    serviceType: { type: String, required: true },
    serviceDetails: {
      // Water Tank Cleaning fields
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: Number,
      wing: String,
      // Pest Control fields
      treatment: String,
      apartment: String,
      // Motor Repairing fields
      workDescription: String,
    },
    lastServiceDate: { type: Date, default: null }, // null for new services
    scheduledDate: { type: Date, required: true }, // Only scheduled date
    nextReminderTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "called", "scheduled", "completed"],
      default: "scheduled",
    },
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    notes: { type: String },
    customReminderHours: { type: Number, default: 0 },
    isNewService: { type: Boolean, default: true },
    escalationLevel: { type: Number, default: 0 },
    callAttempts: { type: Number, default: 0 },
    lastCallAttempt: { type: Date },
    notificationSent: { type: Boolean, default: false },
    notificationHistory: [
      {
        sentAt: { type: Date },
        type: { type: String },
        message: { type: String },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Property =
  mongoose.models.Property ||
  mongoose.model("Property", PropertySchema, "properties");

const Reminder =
  mongoose.models.Reminder || mongoose.model("Reminder", ReminderSchema);

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const properties = await Property.find({}).lean();

      // Calculate stats
      const totalProperties = properties.length;

      // Calculate unique locations
      const uniqueLocations = new Set();
      properties.forEach((property) => {
        if (property.location) {
          // Extract main location (before comma if exists)
          const mainLocation = property.location.split(",")[0].trim();
          uniqueLocations.add(mainLocation);
        }
      });

      const stats = {
        totalProperties,
        uniqueLocations: uniqueLocations.size,
      };

      // Format properties for display
      const formattedProperties = properties.map((property) => ({
        ...property,
        serviceDate: property.serviceDate
          ? new Date(property.serviceDate).toLocaleDateString("en-GB")
          : null,
      }));

      return res.status(200).json({
        properties: formattedProperties,
        stats,
      });
    }

    if (req.method === "POST") {
      // Create the property
      const property = await Property.create(req.body);

      // Create corresponding reminder
      await createReminderFromProperty(property);

      return res.status(201).json(property);
    }

    if (req.method === "DELETE") {
      const { propertyIds } = req.body;

      if (
        !propertyIds ||
        !Array.isArray(propertyIds) ||
        propertyIds.length === 0
      ) {
        return res.status(400).json({ message: "Property IDs are required" });
      }

      try {
        // Convert string IDs to ObjectIds
        const objectIds = propertyIds.map(
          (id) => new mongoose.Types.ObjectId(id)
        );

        // Delete properties
        const deleteResult = await Property.deleteMany({
          _id: { $in: objectIds },
        });

        // Delete associated reminders
        await Reminder.deleteMany({
          propertyId: { $in: objectIds },
        });

        return res.status(200).json({
          message: `Successfully deleted ${deleteResult.deletedCount} property(ies) and associated reminders`,
          deletedCount: deleteResult.deletedCount,
        });
      } catch (error) {
        console.error("Error deleting properties:", error);
        return res.status(500).json({
          message: "Error deleting properties",
          error: error.message,
        });
      }
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Properties API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

// SIMPLIFIED: Helper function to create reminder from property
async function createReminderFromProperty(property) {
  try {
    const serviceDate = new Date(property.serviceDate);

    // Create reminder with serviceDate as scheduledDate only
    await Reminder.create({
      propertyId: property._id,
      propertyName: property.name,
      keyPerson: property.keyPerson,
      contact: property.contact,
      location: property.location,
      serviceType: property.serviceType,
      serviceDetails: property.serviceDetails || {},
      lastServiceDate: null, // New service - will show "New Service"
      scheduledDate: serviceDate, // Only scheduled date
      nextReminderTime: serviceDate,
      status: "scheduled",
      called: false,
      scheduled: true,
      isNewService: true,
      completed: false,
      escalationLevel: 0,
      callAttempts: 0,
      notificationSent: false,
    });

    console.log(
      `Reminder created for property: ${
        property.name
      } scheduled for ${serviceDate.toLocaleDateString("en-GB")}`
    );
  } catch (error) {
    console.error("Error creating reminder:", error);
  }
}
