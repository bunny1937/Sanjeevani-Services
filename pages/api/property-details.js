// pages/api/property-details.js
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Use existing schemas
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
      ohTank: String,
      ugTank: String,
      sintexTank: String,
      numberOfFloors: Number,
      wing: String,
      treatment: String,
      apartment: String,
      workDescription: String,
    },
  },
  { timestamps: true }
);

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
      numberOfFloors: Number,
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
      const { propertyId } = req.query;

      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }

      // Get the property details
      const property = await Property.findById(propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }

      // Get all reminders for this property
      const reminders = await Reminder.find({ propertyId }).sort({
        createdAt: -1,
      });

      // Get active reminders (not completed)
      const activeReminders = reminders.filter(
        (reminder) => !reminder.completed
      );

      // Calculate service history from reminders
      const serviceHistory = reminders
        .filter((reminder) => reminder.lastServiceDate)
        .map((reminder) => ({
          serviceDate: reminder.lastServiceDate,
          amount: property.amount,
          serviceType: property.serviceType,
          status: reminder.status,
        }))
        .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));

      // Add initial service if it exists
      if (property.serviceDate) {
        serviceHistory.push({
          serviceDate: property.serviceDate,
          amount: property.amount,
          serviceType: property.serviceType,
          status: "initial",
        });
      }

      // Calculate statistics
      const stats = {
        totalAmount: serviceHistory.reduce(
          (sum, service) => sum + (service.amount || 0),
          0
        ),
        totalServices: serviceHistory.length,
        avgServiceInterval: calculateAvgServiceInterval(serviceHistory),
      };

      // Create timeline
      const timeline = createTimeline(property, reminders);

      // Prepare response
      const propertyDetails = {
        property: {
          ...property.toObject(),
          serviceDate: property.serviceDate
            ? property.serviceDate.toISOString().split("T")[0]
            : null,
        },
        serviceDetails: property.serviceDetails || {},
        serviceHistory: serviceHistory.map((service) => ({
          ...service,
          serviceDate: service.serviceDate
            ? service.serviceDate.toISOString().split("T")[0]
            : null,
        })),
        reminders: activeReminders.map((reminder) => ({
          _id: reminder._id,
          scheduledDate: reminder.scheduledDate.toISOString().split("T")[0],
          lastServiceDate: reminder.lastServiceDate
            ? reminder.lastServiceDate.toISOString().split("T")[0]
            : null,
          status: reminder.status,
          notes: reminder.notes,
          callAttempts: reminder.callAttempts,
          isNewService: reminder.isNewService,
        })),
        stats,
        timeline: timeline.map((event) => ({
          ...event,
          date: event.date.toISOString().split("T")[0],
        })),
      };

      return res.status(200).json(propertyDetails);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Property Details API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

function calculateAvgServiceInterval(serviceHistory) {
  if (serviceHistory.length < 2) return 0;

  const sortedHistory = serviceHistory
    .filter((service) => service.serviceDate)
    .sort((a, b) => new Date(a.serviceDate) - new Date(b.serviceDate));

  let totalInterval = 0;
  let intervalCount = 0;

  for (let i = 1; i < sortedHistory.length; i++) {
    const prevDate = new Date(sortedHistory[i - 1].serviceDate);
    const currentDate = new Date(sortedHistory[i].serviceDate);
    const interval = Math.abs(currentDate - prevDate) / (1000 * 60 * 60 * 24);

    totalInterval += interval;
    intervalCount++;
  }

  return intervalCount > 0 ? Math.round(totalInterval / intervalCount) : 0;
}

function createTimeline(property, reminders) {
  const timeline = [];

  // Add property creation
  timeline.push({
    date: property.createdAt,
    type: "Property Created",
    description: `Property "${property.name}" was added to the system`,
  });

  // Add service events from reminders
  reminders.forEach((reminder) => {
    if (reminder.lastServiceDate) {
      timeline.push({
        date: reminder.lastServiceDate,
        type: "Service Completed",
        description: `${reminder.serviceType} service completed`,
      });
    }

    if (reminder.called) {
      timeline.push({
        date: reminder.lastCallAttempt || reminder.updatedAt,
        type: "Client Called",
        description: `Client contacted for ${reminder.serviceType} service`,
      });
    }
  });

  // Sort timeline by date (newest first)
  return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
}
