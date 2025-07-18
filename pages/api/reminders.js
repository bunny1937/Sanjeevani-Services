// pages/api/reminders.js - FIXED with only scheduledDate logic
import connectDB from "../../lib/mongodb";
import mongoose from "mongoose";

// Enhanced Reminder Schema with simplified date logic
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
    lastServiceDate: { type: Date, default: null }, // null for new services
    scheduledDate: { type: Date, required: true }, // When service is scheduled
    nextReminderTime: { type: Date, required: true },

    // SIMPLIFIED STATUS WORKFLOW
    status: {
      type: String,
      enum: [
        "pending", // Service date passed, needs calling
        "called", // Called but not rescheduled
        "scheduled", // Service scheduled for future date
        "completed", // Service completed
      ],
      default: "scheduled",
    },

    // Workflow tracking
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    isNewService: { type: Boolean, default: true }, // Track if it's a new service

    // Enhanced tracking fields
    callAttempts: { type: Number, default: 0 },
    lastCallAttempt: { type: Date },
    escalationLevel: { type: Number, default: 0 }, // 0=normal, 1=urgent, 2=critical

    notes: { type: String },
    customReminderHours: { type: Number, default: 0 },

    // Notification tracking
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

// Property Schema (unchanged)
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

// Force recreate models to ensure schema updates
delete mongoose.models.Reminder;
delete mongoose.models.Property;

const Reminder = mongoose.model("Reminder", ReminderSchema);
const Property = mongoose.model("Property", PropertySchema, "properties");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      // FIRST: Update all reminder statuses based on current date
      await updateReminderStatuses();

      // THEN: Check for notifications
      await checkAndSendNotifications();

      // Generate reminders from properties if needed
      await generateRemindersFromProperties();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all reminders with proper categorization
      const allReminders = await Reminder.find({}).sort({
        escalationLevel: -1, // Critical first
        scheduledDate: 1,
      });

      // PROPER CATEGORIZATION
      const overdueReminders = []; // Past scheduled date - needs action
      const currentReminders = []; // Today's services
      const scheduledReminders = []; // Future scheduled services
      const completedReminders = []; // Recently completed

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      allReminders.forEach((reminder) => {
        const reminderObj = formatReminder(reminder, today);
        const scheduledDate = new Date(reminder.scheduledDate);

        if (reminder.completed) {
          if (reminder.updatedAt >= thirtyDaysAgo) {
            completedReminders.push(reminderObj);
          }
        } else if (scheduledDate < today) {
          // Scheduled date has passed
          overdueReminders.push(reminderObj);
        } else if (scheduledDate.toDateString() === today.toDateString()) {
          // Today's services
          currentReminders.push(reminderObj);
        } else {
          // Future scheduled services
          scheduledReminders.push(reminderObj);
        }
      });

      // ACCURATE STATS
      const stats = calculateAccurateStats(allReminders, today);

      return res.status(200).json({
        reminders: currentReminders,
        overdueReminders: overdueReminders,
        scheduledReminders: scheduledReminders,
        upcomingReminders: scheduledReminders, // Add this line
        completedReminders: completedReminders,
        stats: stats,
      });
    }

    if (req.method === "POST") {
      const { action, reminderId, data } = req.body;

      switch (action) {
        case "mark_called":
          await handleMarkCalled(reminderId);
          break;

        case "update_schedule":
          await handleUpdateSchedule(reminderId, data);
          break;

        case "service_done":
          await handleServiceDone(reminderId, data);
          break;

        case "mark_completed":
          await handleMarkCompleted(reminderId);
          break;

        case "add_notes":
          await handleAddNotes(reminderId, data);
          break;
        case "update_service":
          await handleUpdateService(reminderId, data);
          break;
        case "delete_reminder":
          await handleDeleteReminder(reminderId);
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }

      return res.status(200).json({ message: "Reminder updated successfully" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Reminders API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}

// SIMPLIFIED: Update reminder statuses based on current date
async function updateReminderStatuses() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find reminders that need status updates
    const reminders = await Reminder.find({ completed: false });

    for (const reminder of reminders) {
      const scheduledDate = new Date(reminder.scheduledDate);
      let newStatus = reminder.status;

      // If scheduled date has passed and not completed
      if (scheduledDate < today && !reminder.completed) {
        newStatus = "pending"; // Needs calling/action
      } else if (scheduledDate >= today && !reminder.completed) {
        newStatus = "scheduled"; // Future scheduled service
      }

      // Update if status changed
      if (newStatus !== reminder.status) {
        await Reminder.findByIdAndUpdate(reminder._id, {
          status: newStatus,
          updatedAt: new Date(),
        });
      }
    }
  } catch (error) {
    console.error("Error updating reminder statuses:", error);
  }
}

// SIMPLIFIED: Action handlers
async function handleMarkCalled(reminderId) {
  const now = new Date();
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      called: true,
      status: "called",
      lastCallAttempt: now,
      updatedAt: now,
    },
    $inc: {
      callAttempts: 1,
    },
  });
}

async function handleUpdateSchedule(reminderId, data) {
  const { scheduledDate } = data;
  const scheduleDate = new Date(scheduledDate + "T00:00:00.000Z");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Validate scheduled date is not in the past
  if (scheduleDate < today) {
    throw new Error("Cannot schedule a date in the past");
  }

  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      scheduled: true,
      called: true,
      status: "scheduled",
      scheduledDate: scheduleDate,
      nextReminderTime: scheduleDate,
      updatedAt: new Date(),
    },
  });
}

// NEW: Service done handler - marks service as completed and creates next cycle
async function handleServiceDone(reminderId, data) {
  const { completedDate } = data;
  const completionDate = new Date(completedDate + "T00:00:00.000Z");

  // Default next service date (1 month from completion)
  const nextServiceDate = new Date(completionDate);
  nextServiceDate.setMonth(nextServiceDate.getMonth() + 1);

  // Use provided next date or default
  const nextScheduledDate = data.nextServiceDate
    ? new Date(data.nextServiceDate + "T00:00:00.000Z")
    : nextServiceDate;

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  // Mark current service as completed and set up next cycle
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      completed: false, // Keep active for next cycle
      status: "scheduled",
      lastServiceDate: completionDate,
      scheduledDate: nextScheduledDate,
      nextReminderTime: nextScheduledDate,
      called: false,
      scheduled: true,
      isNewService: false, // No longer a new service
      escalationLevel: 0,
      notificationSent: false,
      updatedAt: new Date(),
    },
  });
}

// NEW: Update service handler - updates last service date and creates next cycle
async function handleUpdateService(reminderId, data) {
  const { serviceDate, nextServiceDate } = data;
  const serviceDateObj = new Date(serviceDate + "T00:00:00.000Z");

  // Default next service date (1 month from service date)
  const defaultNextServiceDate = new Date(serviceDateObj);
  defaultNextServiceDate.setMonth(defaultNextServiceDate.getMonth() + 1);

  // Use provided next date or default
  const nextScheduledDate = nextServiceDate
    ? new Date(nextServiceDate + "T00:00:00.000Z")
    : defaultNextServiceDate;

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  // Update service date and set up next cycle
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      completed: false, // Keep active for next cycle
      status: "scheduled",
      lastServiceDate: serviceDateObj,
      scheduledDate: nextScheduledDate,
      nextReminderTime: nextScheduledDate,
      called: false,
      scheduled: true,
      isNewService: false,
      escalationLevel: 0,
      callAttempts: 0, // Reset call attempts
      notificationSent: false,
      updatedAt: new Date(),
    },
  });
}

async function handleMarkCompleted(reminderId) {
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  const completionDate = new Date();

  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      completed: true,
      status: "completed",
      lastServiceDate: reminder.isNewService
        ? reminder.scheduledDate
        : completionDate,
      escalationLevel: 0,
      updatedAt: completionDate,
    },
  });
}

async function handleAddNotes(reminderId, data) {
  const { notes } = data;
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      notes: notes,
      updatedAt: new Date(),
    },
  });
}

async function handleDeleteReminder(reminderId) {
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  await Reminder.findByIdAndDelete(reminderId);
}

// SIMPLIFIED STATS CALCULATION
function calculateAccurateStats(reminders, today) {
  const stats = {
    totalReminders: 0,
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    completed: 0,
  };

  reminders.forEach((reminder) => {
    if (reminder.completed) {
      stats.completed++;
    } else {
      stats.totalReminders++;

      const scheduledDate = new Date(reminder.scheduledDate);

      if (scheduledDate < today) {
        stats.overdue++;
      } else if (scheduledDate.toDateString() === today.toDateString()) {
        stats.dueToday++;
      } else {
        stats.upcoming++;
      }
    }
  });

  return stats;
}

// SIMPLIFIED NOTIFICATION SYSTEM
async function checkAndSendNotifications() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find overdue reminders
    const overdueReminders = await Reminder.find({
      scheduledDate: { $lt: today },
      completed: false,
      notificationSent: false,
    });

    // Send notifications for overdue reminders
    for (const reminder of overdueReminders) {
      await sendNotification(reminder, "overdue");
    }
  } catch (error) {
    console.error("Error checking notifications:", error);
  }
}

// SIMPLIFIED NOTIFICATION FUNCTION
async function sendNotification(reminder, type) {
  let message = "";
  let urgency = "normal";

  switch (type) {
    case "overdue":
      message = `🚨 OVERDUE: ${reminder.propertyName} - ${
        reminder.serviceType
      } service was scheduled for ${new Date(
        reminder.scheduledDate
      ).toLocaleDateString("en-GB")}`;
      urgency = "high";
      break;
    case "due_today":
      message = `🔔 TODAY: ${reminder.propertyName} - ${reminder.serviceType} service is scheduled for today`;
      urgency = "normal";
      break;
  }

  const fullMessage = `${message}
📍 Location: ${reminder.location}
👤 Contact: ${reminder.keyPerson} (${reminder.contact})
📅 Scheduled Date: ${new Date(reminder.scheduledDate).toLocaleDateString(
    "en-GB"
  )}
🔔 Urgency: ${urgency.toUpperCase()}`;

  console.log("=".repeat(60));
  console.log(`${urgency.toUpperCase()} NOTIFICATION`);
  console.log("=".repeat(60));
  console.log(fullMessage);
  console.log("=".repeat(60));

  // Mark as notified
  await Reminder.findByIdAndUpdate(reminder._id, {
    notificationSent: true,
    $push: {
      notificationHistory: {
        sentAt: new Date(),
        type: type,
        message: fullMessage,
      },
    },
  });

  return true;
}

// SIMPLIFIED: Enhanced reminder formatting
function formatReminder(reminder, today) {
  const scheduledDate = new Date(reminder.scheduledDate);
  scheduledDate.setHours(0, 0, 0, 0);

  // Determine status
  const isOverdue = scheduledDate < today && !reminder.completed;
  const isDueToday = scheduledDate.toDateString() === today.toDateString();

  // Proper last service date handling
  let lastServiceDisplay = "New Service";
  if (reminder.lastServiceDate && reminder.lastServiceDate !== null) {
    lastServiceDisplay = new Date(reminder.lastServiceDate).toLocaleDateString(
      "en-GB"
    );
  }

  return {
    _id: reminder._id,
    propertyName: reminder.propertyName,
    keyPerson: reminder.keyPerson,
    contact: reminder.contact,
    location: reminder.location,
    serviceType: reminder.serviceType,
    lastService: lastServiceDisplay,
    scheduledDate: reminder.scheduledDate,
    status: reminder.status,
    called: reminder.called,
    scheduled: reminder.scheduled,
    completed: reminder.completed,
    notes: reminder.notes,
    isOverdue: isOverdue,
    isDueToday: isDueToday,
    escalationLevel: reminder.escalationLevel,
    callAttempts: reminder.callAttempts,
    isNewService: reminder.isNewService,
    urgencyLevel: isOverdue ? "high" : "normal",
    customReminderHours: reminder.customReminderHours,
    notificationSent: reminder.notificationSent,
    notificationHistory: reminder.notificationHistory || [],
  };
}

// SIMPLIFIED: Reminder generation from properties
async function generateRemindersFromProperties() {
  try {
    const properties = await Property.find({});

    for (const property of properties) {
      if (property.serviceDate) {
        const existingReminder = await Reminder.findOne({
          propertyId: property._id,
          completed: false,
        });

        if (!existingReminder) {
          const serviceDate = new Date(property.serviceDate);

          await Reminder.create({
            propertyId: property._id,
            propertyName: property.name,
            keyPerson: property.keyPerson,
            contact: property.contact,
            location: property.location,
            serviceType: property.serviceType,
            lastServiceDate: null, // New service
            scheduledDate: serviceDate,
            nextReminderTime: serviceDate,
            status: "scheduled",
            called: false,
            scheduled: true,
            completed: false,
            isNewService: true,
            notificationSent: false,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error generating reminders:", error);
  }
}
