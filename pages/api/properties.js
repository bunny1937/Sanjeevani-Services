// pages/api/properties.js - Fixed to properly handle on-hold properties
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Property Schema - Updated to make serviceDate truly optional
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
    area: {
      type: String,
      required: false,
    },
    serviceType: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    isOnHold: {
      type: Boolean,
      default: false,
    },
    serviceDate: {
      type: Date,
      required: false,
      default: null,
      validate: {
        validator: function (value) {
          // Allow null/undefined for on-hold properties
          if (this.isOnHold) {
            return true; // Always valid for on-hold properties
          }
          // For non-on-hold properties, serviceDate can still be optional
          return true;
        },
        message: "Service date validation failed",
      },
    },
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

// Enhanced Reminder Schema for on-hold properties
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
    lastServiceDate: { type: Date, default: null },
    // Renamed serviceDate to scheduledDate for clarity and consistency with reminders.js
    scheduledDate: {
      type: Date,
      required: false, // Can be null for on-hold reminders
      default: null,
    },
    nextReminderTime: {
      type: Date,
      required: false, // Can be null for on-hold reminders
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "called", "scheduled", "completed", "on_hold"],
      default: "scheduled", // Default to scheduled, will be overridden for on_hold
    },
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: true }, // Default to true, will be overridden for on_hold
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

// Force model recreation to ensure schema updates
delete mongoose.models.Property;
delete mongoose.models.Reminder;

const Property = mongoose.model("Property", PropertySchema, "properties");
const Reminder = mongoose.model("Reminder", ReminderSchema);

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const properties = await Property.find({}).lean();

      // Calculate stats
      const totalProperties = properties.length;
      const onHoldProperties = properties.filter((p) => p.isOnHold).length;

      // Calculate unique locations
      const uniqueLocations = new Set();
      properties.forEach((property) => {
        if (property.location) {
          const mainLocation = property.location.split(",")[0].trim();
          uniqueLocations.add(mainLocation);
        }
      });

      const stats = {
        totalProperties,
        onHoldProperties,
        activeProperties: totalProperties - onHoldProperties,
        uniqueLocations: uniqueLocations.size,
      };

      // Format properties for display
      // Format properties for display
      const formattedProperties = properties.map((property) => ({
        ...property,
        // Ensure serviceDate is formatted or explicitly "On Hold"
        serviceDate: property.serviceDate
          ? new Date(property.serviceDate).toLocaleDateString("en-GB")
          : property.isOnHold
          ? "On Hold" // Display "On Hold" if isOnHold is true and serviceDate is null
          : null, // Otherwise, it's truly null/not set
        statusDisplay: property.isOnHold ? "On Hold" : "Active",
      }));
      return res.status(200).json({ properties: formattedProperties, stats });
    }

    if (req.method === "POST") {
      // Validate and sanitize the request body
      const {
        name,
        keyPerson,
        contact,
        location,
        area,
        serviceType,
        amount,
        serviceDate,
        serviceDetails,
      } = req.body;

      // Prepare the property data
      const propertyData = {
        name: name?.trim(),
        keyPerson: keyPerson?.trim(),
        contact: contact?.trim(),
        location: location?.trim(),
        area: area?.trim() || "",
        serviceType: serviceType?.trim(),
        amount: parseFloat(amount),
        serviceDetails: serviceDetails || {},
      };

      // Handle serviceDate and isOnHold logic
      if (!serviceDate || serviceDate.trim() === "") {
        propertyData.serviceDate = null;
        propertyData.isOnHold = true;
        console.log(
          "Property will be created as ON HOLD (no service date provided)"
        );
      } else {
        try {
          propertyData.serviceDate = new Date(serviceDate);
          propertyData.isOnHold = false;
          console.log(
            "Property will be created with service date:",
            propertyData.serviceDate
          );
        } catch (error) {
          console.error("Invalid service date provided:", serviceDate);
          propertyData.serviceDate = null;
          propertyData.isOnHold = true;
        }
      }

      console.log("Creating property with data:", propertyData);

      // Create the property
      const property = await Property.create(propertyData);
      console.log("Property created successfully:", property.name);

      // Always create a reminder - even for on-hold properties
      const reminder = await createReminderFromProperty(property);

      if (reminder) {
        console.log("Reminder created successfully");
      } else {
        console.log("Reminder creation handled appropriately");
      }

      return res.status(201).json({
        property,
        reminder: reminder ? "created" : "on_hold",
        message: property.isOnHold
          ? "Property created and placed on hold. You can set the service date later."
          : "Property and reminder created successfully.",
      });
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
        const reminderDeleteResult = await Reminder.deleteMany({
          propertyId: { $in: objectIds },
        });

        return res.status(200).json({
          message: `Successfully deleted ${deleteResult.deletedCount} property(ies) and ${reminderDeleteResult.deletedCount} associated reminder(s)`,
          deletedCount: deleteResult.deletedCount,
          deletedReminders: reminderDeleteResult.deletedCount,
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

async function createReminderFromProperty(property) {
  try {
    console.log(
      `Creating reminder for property: ${property.name}, isOnHold: ${property.isOnHold}`
    );

    // Create reminder data
    const reminderData = {
      propertyId: property._id,
      propertyName: property.name,
      keyPerson: property.keyPerson,
      contact: property.contact,
      location: property.location,
      serviceType: property.serviceType,
      serviceDetails: property.serviceDetails || {},
      lastServiceDate: null, // New service
      isNewService: true,
      escalationLevel: 0,
      callAttempts: 0,
      notificationSent: false,
    };

    if (property.isOnHold || !property.serviceDate) {
      // Create on-hold reminder
      reminderData.scheduledDate = null; // Explicitly null for on-hold
      reminderData.nextReminderTime = null; // Explicitly null for on-hold
      reminderData.status = "on_hold";
      reminderData.called = false;
      reminderData.scheduled = false;
      reminderData.completed = false;

      console.log("Creating ON HOLD reminder");
    } else {
      // Create scheduled reminder
      const serviceDate = new Date(property.serviceDate);

      // Validate that serviceDate is a valid date
      if (isNaN(serviceDate.getTime())) {
        console.error(`Invalid service date for property "${property.name}"`);
        return null;
      }

      reminderData.scheduledDate = serviceDate; // Use scheduledDate
      reminderData.nextReminderTime = serviceDate;
      reminderData.status = "scheduled";
      reminderData.called = false;
      reminderData.scheduled = true;
      reminderData.completed = false;

      console.log(
        "Creating SCHEDULED reminder for:",
        serviceDate.toLocaleDateString("en-GB")
      );
    }

    console.log("Reminder data:", reminderData);

    const reminder = await Reminder.create(reminderData);

    console.log(
      `Reminder created successfully for property: ${property.name} (${
        property.status === "on_hold" ? "ON HOLD" : "SCHEDULED"
      })`
    );

    return reminder;
  } catch (error) {
    console.error("Error creating reminder:", error);
    return null;
  }
}
