// pages/api/reminders.js - FIXED VERSION
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
    scheduledDate: { type: Date, required: false, default: null }, // Can be null for on_hold
    nextReminderTime: { type: Date, required: false, default: null }, // Can be null for on_hold

    // SIMPLIFIED STATUS WORKFLOW
    status: {
      type: String,
      enum: [
        "pending", // Service date passed, needs calling
        "called", // Called but not rescheduled
        "scheduled", // Service scheduled for future date
        "completed", // Service completed
        "on_hold", // Property is on hold
      ],
      default: "scheduled", // Default, but will be set explicitly
    },

    // Workflow tracking
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: true }, // Default, but will be set explicitly
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
      required: false, // Made optional - can be null/empty for "on hold" properties
      default: null,
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
        const reminderObj = formatReminder(reminder, today); // THIS LINE IS HERE

        if (reminderObj.completed) {
          if (reminder.updatedAt >= thirtyDaysAgo) {
            completedReminders.push(reminderObj);
          }
          return; // SKIP ALL OTHER CATEGORIES
        }

        // Handle on_hold reminders separately (they are not overdue/due today in the traditional sense)
        if (reminderObj.status === "on_hold") {
          currentReminders.push(reminderObj);
          return;
        }

        // For non-completed, non-on_hold reminders, categorize based on date
        const scheduledDate = new Date(reminderObj.scheduledDate);
        scheduledDate.setHours(0, 0, 0, 0);

        if (scheduledDate < today) {
          overdueReminders.push(reminderObj);
        } else if (scheduledDate.toDateString() === today.toDateString()) {
          currentReminders.push(reminderObj);
        } else {
          scheduledReminders.push(reminderObj);
        }
      });

      // ACCURATE STATS
      const stats = calculateAccurateStats(allReminders, today);

      return res.status(200).json({
        reminders: currentReminders,
        overdueReminders: overdueReminders,
        scheduledReminders: scheduledReminders,
        upcomingReminders: scheduledReminders,
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

    // Find reminders that need status updates (not completed, not on_hold)
    const remindersToUpdate = await Reminder.find({
      completed: false,
      status: { $ne: "on_hold" }, // Exclude on_hold reminders from status updates
    });

    for (const reminder of remindersToUpdate) {
      const scheduledDate = new Date(reminder.scheduledDate);
      let newStatus = reminder.status;

      // If scheduled date has passed
      if (scheduledDate < today) {
        newStatus = "pending"; // Needs calling/action
      } else {
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

// FIXED: Service done handler - properly marks as completed
async function handleServiceDone(reminderId, data) {
  const { completedDate, nextServiceDate } = data;
  const completionDate = new Date(completedDate + "T00:00:00.000Z");

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  if (nextServiceDate) {
    // Create next cycle reminder
    const nextScheduledDate = new Date(nextServiceDate + "T00:00:00.000Z");

    // Create new reminder for next cycle
    await Reminder.create({
      propertyId: reminder.propertyId,
      propertyName: reminder.propertyName,
      keyPerson: reminder.keyPerson,
      contact: reminder.contact,
      location: reminder.location,
      serviceType: reminder.serviceType,
      lastServiceDate: completionDate,
      scheduledDate: nextScheduledDate,
      nextReminderTime: nextScheduledDate,
      status: "scheduled",
      called: false,
      scheduled: true,
      completed: false,
      isNewService: false,
      escalationLevel: 0,
      notificationSent: false,
    });
  }

  // Mark current service as completed
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      completed: true, // FIXED: Mark as completed
      status: "completed",
      lastServiceDate: completionDate,
      escalationLevel: 0,
      updatedAt: new Date(),
    },
  });
}

// FIXED: Update service handler - properly marks as completed
async function handleUpdateService(reminderId, data) {
  const { serviceDate, nextServiceDate } = data;
  const serviceDateObj = new Date(serviceDate + "T00:00:00.000Z");

  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  if (nextServiceDate) {
    // Create next cycle reminder
    const nextScheduledDate = new Date(nextServiceDate + "T00:00:00.000Z");

    // Create new reminder for next cycle
    await Reminder.create({
      propertyId: reminder.propertyId,
      propertyName: reminder.propertyName,
      keyPerson: reminder.keyPerson,
      contact: reminder.contact,
      location: reminder.location,
      serviceType: reminder.serviceType,
      lastServiceDate: serviceDateObj,
      scheduledDate: nextScheduledDate,
      nextReminderTime: nextScheduledDate,
      status: "scheduled",
      called: false,
      scheduled: true,
      completed: false,
      isNewService: false,
      escalationLevel: 0,
      callAttempts: 0,
      notificationSent: false,
    });
  }

  // Mark current service as completed
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      completed: true, // FIXED: Mark as completed
      status: "completed",
      lastServiceDate: serviceDateObj,
      escalationLevel: 0,
      updatedAt: new Date(),
    },
  });
}

async function handleMarkCompleted(reminderId) {
  const reminder = await Reminder.findById(reminderId);
  if (!reminder) {
    throw new Error("Reminder not found");
  }

  // Simply mark the existing reminder as completed - NO new entries
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      completed: true,
      status: "completed",
      lastServiceDate: new Date(), // Set completion date
      scheduledDate: null, // Clear scheduled date for completed reminders
      nextReminderTime: null, // Clear next reminder time
      escalationLevel: 0,
      updatedAt: new Date(),
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

  // If it's a completed reminder, mark property to not auto-generate
  if (reminder.completed) {
    await Property.findByIdAndUpdate(reminder.propertyId, {
      autoGenerateReminders: false,
    });
  }

  await Reminder.findByIdAndDelete(reminderId);
}

// SIMPLIFIED STATS CALCULATION
function calculateAccurateStats(reminders, today) {
  const stats = {
    totalReminders: 0, // Total active (non-completed) reminders
    overdue: 0,
    dueToday: 0,
    upcoming: 0,
    scheduled: 0, // Specifically for reminders with 'scheduled' status
    completed: 0,
    critical: 0,
    failed_contact: 0,
    on_hold: 0, // New stat for on-hold reminders
  };

  reminders.forEach((reminder) => {
    if (reminder.completed) {
      stats.completed++;
    } else {
      stats.totalReminders++; // Count all non-completed

      if (reminder.status === "on_hold") {
        stats.on_hold++;
      } else {
        // Only process non-on_hold reminders for date-based stats
        const scheduledDate = new Date(reminder.scheduledDate);

        if (scheduledDate < today) {
          stats.overdue++;
        } else if (scheduledDate.toDateString() === today.toDateString()) {
          stats.dueToday++;
        } else {
          stats.upcoming++;
        }

        if (reminder.status === "scheduled") {
          stats.scheduled++;
        }
      }

      if (reminder.escalationLevel === 2) {
        stats.critical++;
      }

      if (reminder.callAttempts >= 4) {
        stats.failed_contact++;
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
  let isOverdue = false;
  let isDueToday = false;
  let scheduledDateObj = null;

  // If the reminder is completed, it cannot be overdue or due today
  if (reminder.completed) {
    return {
      ...reminder.toObject(),
      isOverdue: false,
      isDueToday: false,
    };
  } else if (reminder.scheduledDate && reminder.status !== "on_hold") {
    scheduledDateObj = new Date(reminder.scheduledDate);
    scheduledDateObj.setHours(0, 0, 0, 0);
    isOverdue = scheduledDateObj < today;
    isDueToday = scheduledDateObj.toDateString() === today.toDateString();
  }

  // Proper last service date handling
  let lastServiceDisplay = "New Service";
  if (reminder.lastServiceDate) {
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
    scheduledDate: reminder.scheduledDate, // Keep original for display
    status: reminder.status,
    called: reminder.called,
    scheduled: reminder.scheduled,
    completed: reminder.completed,
    notes: reminder.notes,
    isOverdue: isOverdue, // Only true for non-on_hold and past date
    isDueToday: isDueToday, // Only true for non-on_hold and today's date
    escalationLevel: reminder.escalationLevel,
    callAttempts: reminder.callAttempts,
    isNewService: reminder.isNewService,
    urgencyLevel: isOverdue ? "high" : "normal",
    customReminderHours: reminder.customReminderHours,
    notificationSent: reminder.notificationSent,
    notificationHistory: reminder.notificationHistory || [],
  };
}

async function generateRemindersFromProperties() {
  try {
    const properties = await Property.find({ autoGenerateReminders: true });

    for (const property of properties) {
      const existingReminder = await Reminder.findOne({
        propertyId: property._id,
        $or: [
          { completed: false },
          {
            completed: true,
            updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        ],
      });

      if (!existingReminder) {
        if (property.serviceDate && !property.isOnHold) {
          const serviceDate = new Date(property.serviceDate);

          if (isNaN(serviceDate.getTime())) {
            console.warn(
              `Skipping reminder generation for property "${property.name}" due to invalid serviceDate: ${property.serviceDate}`
            );
            continue;
          }

          await Reminder.create({
            propertyId: property._id,
            propertyName: property.name,
            keyPerson: property.keyPerson,
            contact: property.contact,
            location: property.location,
            serviceType: property.serviceType,
            serviceDetails: property.serviceDetails || {},
            lastServiceDate: null,
            scheduledDate: serviceDate,
            nextReminderTime: serviceDate,
            status: "scheduled",
            called: false,
            scheduled: true,
            completed: false,
            isNewService: true,
            notificationSent: false,
          });

          console.log(
            `Auto-generated scheduled reminder for: ${
              property.name
            } - ${serviceDate.toLocaleDateString("en-GB")}`
          );
        } else if (property.isOnHold || !property.serviceDate) {
          // Create on-hold reminder for properties without service dates or explicitly on hold
          await Reminder.create({
            propertyId: property._id,
            propertyName: property.name,
            keyPerson: property.keyPerson,
            contact: property.contact,
            location: property.location,
            serviceType: property.serviceType,
            serviceDetails: property.serviceDetails || {},
            lastServiceDate: null,
            scheduledDate: null, // Explicitly null for on-hold
            nextReminderTime: null, // Explicitly null for on-hold
            status: "on_hold",
            called: false,
            scheduled: false,
            completed: false,
            isNewService: true,
            notificationSent: false,
          });

          console.log(`Auto-generated on-hold reminder for: ${property.name}`);
        }
      }
    }
  } catch (error) {
    console.error("Error generating reminders:", error);
  }
}
