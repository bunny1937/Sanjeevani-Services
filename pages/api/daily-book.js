// pages/api/daily-book.js
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Property Schema for auto-adding new properties
const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    keyPerson: String,
    contact: String,
    location: String,
    area: String,
    serviceType: String,
    amount: Number,
    serviceDate: { type: Date, required: true },
    serviceDetails: {
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: String,
      wing: String,
      treatment: String,
      apartment: String,
      workDescription: String,
    },
    type: { type: String, default: "Client" },
    services: [String],
    totalJobs: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastServiceDate: Date,
    status: { type: String, default: "Active" },
    remarks: String,
    // Add autoGenerateReminders field to PropertySchema if it's not already there
    autoGenerateReminders: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// DailyBook Schema with service-specific details
const DailyBookSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true }, // Changed to Date type and will be used as service date
    property: { type: String, required: true },
    keyPerson: String,
    contact: String,
    location: String,
    service: { type: String, required: true },
    amount: { type: Number, default: 0 },
    remarks: String,
    serviceDetails: {
      // Water Tank Cleaning fields
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: String,
      wing: String,
      // Pest Control fields
      treatment: String,
      apartment: String,
      // Motor Repairing & Rewinding fields
      workDescription: String,
    },
  },
  { timestamps: true }
);

// Reminder Schema (same as reminders.js)
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
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: String,
      wing: String,
      treatment: String,
      apartment: String,
      workDescription: String,
    },
    lastServiceDate: { type: Date, default: null },
    scheduledDate: { type: Date, required: true },
    nextReminderTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "called", "scheduled", "completed", "on_hold"], // Added on_hold
      default: "scheduled",
    },
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    notes: { type: String },
    customReminderHours: { type: Number, default: 0 },
    isNewService: { type: Boolean, default: false },
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

// Ensure models are not re-compiled if already defined
const DailyBook =
  mongoose.models.DailyBook ||
  mongoose.model("DailyBook", DailyBookSchema, "dailybooks");

const Property =
  mongoose.models.Property ||
  mongoose.model("Property", PropertySchema, "properties");

const Reminder =
  mongoose.models.Reminder ||
  mongoose.model("Reminder", ReminderSchema, "reminders");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const dailyBook = await DailyBook.find({}).lean();

      // Calculate stats
      const totalEntries = dailyBook.length;
      const totalAmount = dailyBook.reduce(
        (sum, entry) => sum + (entry.amount || 0),
        0
      );

      // If requesting stats only
      if (req.query.stats === "true") {
        return res.status(200).json({
          totalEntries,
          totalAmount,
        });
      }

      // Return entries with stats
      return res.status(200).json({
        entries: dailyBook,
        stats: {
          totalEntries,
          totalAmount,
        },
      });
    }

    if (req.method === "POST") {
      const entryData = req.body;

      // Validate required fields
      if (!entryData.date || !entryData.property || !entryData.service) {
        return res.status(400).json({
          message:
            "Missing required fields: date, property, and service are required",
        });
      }

      // Convert date string to Date object
      let serviceDate;
      try {
        serviceDate = new Date(entryData.date);
        // Validate date
        if (isNaN(serviceDate.getTime())) {
          return res.status(400).json({
            message: "Invalid date format",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid date format",
        });
      }

      // First, check if property exists
      let existingProperty = await Property.findOne({
        name: { $regex: new RegExp(`^${entryData.property}$`, "i") },
      });

      if (!existingProperty) {
        // Create new property automatically
        const newProperty = new Property({
          name: entryData.property,
          keyPerson: entryData.keyPerson,
          contact: entryData.contact,
          location: entryData.location,
          serviceType: entryData.service,
          amount: entryData.amount || 0,
          serviceDate: serviceDate,
          serviceDetails: entryData.serviceDetails || {},
          services: [entryData.service],
          totalJobs: 1,
          totalRevenue: entryData.amount || 0,
          lastServiceDate: serviceDate,
          status: "Active",
          remarks: `Auto-created from daily book entry on ${new Date().toLocaleDateString()}`,
          isOnHold: false, // New properties from daily book are active
        });

        await newProperty.save();
        existingProperty = newProperty;
        console.log(`New property created: ${entryData.property}`);
      } else {
        // Update existing property stats and details
        const updateData = {
          $inc: {
            totalJobs: 1,
            totalRevenue: entryData.amount || 0,
          },
          $set: {
            lastServiceDate: serviceDate,
            keyPerson: entryData.keyPerson,
            contact: entryData.contact,
            location: entryData.location,
            serviceType: entryData.service, // Update serviceType if it changed
            amount: entryData.amount || 0, // Update amount if it changed
            serviceDate: serviceDate, // Update serviceDate
            serviceDetails: entryData.serviceDetails || {}, // Update serviceDetails
            isOnHold: false, // Ensure property is not on hold if a service date is provided
          },
        };

        // Add service to services array if not already present
        if (!existingProperty.services.includes(entryData.service)) {
          updateData.$addToSet = { services: entryData.service };
        }

        await Property.findByIdAndUpdate(existingProperty._id, updateData);
        console.log(`Property updated: ${entryData.property}`);
      }

      // Create the daily book entry
      const entryToSave = {
        date: serviceDate, // Use the service date as the main date
        property: entryData.property,
        keyPerson: entryData.keyPerson,
        contact: entryData.contact,
        location: entryData.location,
        service: entryData.service,
        amount: entryData.amount || 0,
        remarks: entryData.remarks || "",
        serviceDetails: entryData.serviceDetails || {},
      };

      const entry = await DailyBook.create(entryToSave);

      // Handle reminder creation/update for completed service
      await handleReminderForCompletedService(
        existingProperty,
        entryData,
        serviceDate
      );

      return res.status(201).json({
        entry,
        message: "Entry added, property updated, and reminder scheduled",
      });
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const entryData = req.body;

      // Convert date string to Date object
      let updatedServiceDate;
      if (entryData.date) {
        try {
          updatedServiceDate = new Date(entryData.date);
          // Validate date
          if (isNaN(updatedServiceDate.getTime())) {
            return res.status(400).json({
              message: "Invalid date format",
            });
          }
        } catch (error) {
          return res.status(400).json({
            message: "Invalid date format",
          });
        }
      }

      // Find the original daily book entry to get the property name
      const originalEntry = await DailyBook.findById(id);
      if (!originalEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Find the corresponding property
      let existingProperty = await Property.findOne({
        name: { $regex: new RegExp(`^${originalEntry.property}$`, "i") },
      });

      if (!existingProperty) {
        // Handle the case where the property is not found
        return res.status(404).json({
          message: `Property "${originalEntry.property}" not found. Cannot update associated records.`,
        });
      }

      // Update the property details
      const propertyUpdateData = {
        keyPerson: entryData.keyPerson,
        contact: entryData.contact,
        location: entryData.location,
        serviceType: entryData.service,
        amount: entryData.amount || 0,
        serviceDetails: entryData.serviceDetails || {},
        // Update serviceDate if it changed in the daily book entry
        serviceDate: updatedServiceDate,
        isOnHold: false, // If a service date is provided, it's not on hold
      };

      // Check if services is defined before accessing it
      if (
        existingProperty.services &&
        !existingProperty.services.includes(entryData.service) &&
        entryData.service
      ) {
        propertyUpdateData.$addToSet = { services: entryData.service };
      }

      await Property.findByIdAndUpdate(
        existingProperty._id,
        propertyUpdateData,
        {
          new: true,
        }
      );
      console.log(
        `Property "${existingProperty.name}" updated from daily book edit.`
      );

      // Update the daily book entry itself
      const updatedEntry = await DailyBook.findByIdAndUpdate(
        id,
        { ...entryData, date: updatedServiceDate }, // Ensure date is Date object
        { new: true }
      );

      // Handle reminder for the edited service
      await handleReminderForCompletedService(
        existingProperty,
        entryData,
        updatedServiceDate
      );

      return res.status(200).json({
        updatedEntry,
        message: "Entry and associated property/reminder updated successfully",
      });
    }

    if (req.method === "DELETE") {
      const { id } = req.query;

      const deletedEntry = await DailyBook.findByIdAndDelete(id);

      if (!deletedEntry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      return res.status(200).json({ message: "Entry deleted successfully" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Daily Book API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

// Function to handle reminder creation/update when service is completed
async function handleReminderForCompletedService(
  property,
  entryData,
  serviceDate
) {
  try {
    // Calculate next scheduled date (4 months from service date)
    const nextScheduledDate = new Date(serviceDate);
    nextScheduledDate.setMonth(nextScheduledDate.getMonth() + 4);

    // Find an existing active reminder for this property and service type
    // We look for non-completed reminders, or completed ones that were very recent (e.g., within the last day)
    // to avoid creating duplicates if the daily book entry is added/edited quickly after a service.
    const existingReminder = await Reminder.findOne({
      propertyId: property._id,
      serviceType: entryData.service,
      $or: [
        { completed: false },
        {
          completed: true,
          updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }, // Check for recently completed
      ],
    });

    if (existingReminder) {
      // Update existing reminder with new cycle
      await Reminder.findByIdAndUpdate(existingReminder._id, {
        $set: {
          lastServiceDate: serviceDate, // Set the actual service date
          scheduledDate: nextScheduledDate,
          nextReminderTime: nextScheduledDate,
          status: "scheduled",
          called: false,
          scheduled: true,
          completed: false,
          isNewService: false, // Set to false since service was actually performed
          escalationLevel: 0,
          callAttempts: 0,
          notificationSent: false,
          serviceDetails: entryData.serviceDetails || {},
          updatedAt: new Date(),
        },
      });

      console.log(
        `Reminder updated for ${property.name} - ${
          entryData.service
        }, last service: ${serviceDate.toLocaleDateString(
          "en-GB"
        )}, next service: ${nextScheduledDate.toLocaleDateString("en-GB")}`
      );
    } else {
      // Create new reminder
      await Reminder.create({
        propertyId: property._id,
        propertyName: property.name,
        keyPerson: property.keyPerson,
        contact: property.contact,
        location: property.location,
        serviceType: entryData.service,
        serviceDetails: entryData.serviceDetails || {},
        lastServiceDate: serviceDate, // Set the actual service date
        scheduledDate: nextScheduledDate,
        nextReminderTime: nextScheduledDate,
        status: "scheduled",
        called: false,
        scheduled: true,
        completed: false,
        isNewService: false, // Set to false since service was actually performed
        escalationLevel: 0,
        callAttempts: 0,
        notificationSent: false,
      });

      console.log(
        `New reminder created for ${property.name} - ${
          entryData.service
        }, last service: ${serviceDate.toLocaleDateString(
          "en-GB"
        )}, next service: ${nextScheduledDate.toLocaleDateString("en-GB")}`
      );
    }
  } catch (error) {
    console.error("Error handling reminder for completed service:", error);
  }
}
