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
      await checkAndSendNotifications(); // This will now handle all notification types

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
        upcomingReminders: scheduledReminders, // This is already correct, as scheduledReminders are future ones
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

        case "set_custom_reminder": // NEW ACTION
          await handleSetCustomReminder(reminderId, data);
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

    const remindersToUpdate = await Reminder.find({
      completed: false,
      status: { $ne: "on_hold" },
    });

    for (const reminder of remindersToUpdate) {
      const scheduledDate = new Date(reminder.scheduledDate);
      let newStatus = reminder.status;
      let newEscalationLevel = reminder.escalationLevel;

      if (scheduledDate < today) {
        newStatus = "pending"; // Needs calling/action
        // Logic to increase escalation level for overdue reminders
        if (reminder.callAttempts >= 4) {
          newEscalationLevel = 2; // Critical after 4 failed attempts
        } else if (reminder.callAttempts >= 2) {
          newEscalationLevel = 1; // Urgent after 2 failed attempts
        } else {
          newEscalationLevel = 0; // Default for overdue but few attempts
        }
      } else {
        newStatus = "scheduled"; // Future scheduled service
        newEscalationLevel = 0; // Reset escalation for scheduled reminders
      }

      // Update if status or escalation level changed
      if (
        newStatus !== reminder.status ||
        newEscalationLevel !== reminder.escalationLevel
      ) {
        await Reminder.findByIdAndUpdate(reminder._id, {
          status: newStatus,
          escalationLevel: newEscalationLevel, // Update escalation level
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
    }
  });

  return stats;
}
async function handleSetCustomReminder(reminderId, data) {
  const { hours } = data;
  const now = new Date();
  const customReminderTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
  await Reminder.findByIdAndUpdate(reminderId, {
    $set: {
      nextReminderTime: customReminderTime, // Set a specific time for the custom reminder
      customReminderHours: hours, // Store the hours for reference
      notificationSent: false, // Reset notification status for this custom reminder
      updatedAt: new Date(),
    },
  });
}
// SIMPLIFIED NOTIFICATION SYSTEM
async function checkAndSendNotifications() {
  try {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // 1. Overdue Reminders (scheduledDate is in the past)
    const overdueReminders = await Reminder.find({
      scheduledDate: { $lt: today },
      completed: false,
      status: { $ne: "on_hold" },
      notificationSent: false, // Only send if not already sent for this overdue state
    });

    for (const reminder of overdueReminders) {
      await sendNotification(reminder, "overdue");
    }

    // 2. Due Today Reminders (scheduledDate is today)
    const dueTodayReminders = await Reminder.find({
      scheduledDate: { $gte: today, $lt: tomorrow },
      completed: false,
      status: { $ne: "on_hold" },
      notificationSent: false, // Only send if not already sent for today
    });

    for (const reminder of dueTodayReminders) {
      await sendNotification(reminder, "due_today");
    }

    // 3. Upcoming Reminders (scheduled for tomorrow, sent at 12:00 AM)
    const upcomingTomorrowReminders = await Reminder.find({
      scheduledDate: {
        $gte: tomorrow,
        $lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      }, // Scheduled for tomorrow
      completed: false,
      status: { $ne: "on_hold" },
      notificationSent: false, // Only send if not already sent for tomorrow
    });

    for (const reminder of upcomingTomorrowReminders) {
      // Ensure this notification is sent only once at 12 AM
      // This requires a more robust notification tracking or a separate cron job.
      // For simplicity, we'll mark it as sent.
      await sendNotification(reminder, "upcoming_tomorrow");
    }

    // 4. Custom Follow-up Reminders
    const customReminders = await Reminder.find({
      nextReminderTime: { $lte: now }, // Reminder time has passed
      completed: false,
      notificationSent: false, // Only send if not already sent for this custom time
      customReminderHours: { $gt: 0 }, // Ensure it's a custom reminder
    });

    for (const reminder of customReminders) {
      await sendNotification(reminder, "custom_followup");
    }
  } catch (error) {
    console.error("Error checking and sending notifications:", error);
  }
}

// SIMPLIFIED NOTIFICATION FUNCTION
async function sendNotification(reminder, type) {
  let message = "";
  let urgency = "normal";
  let notificationType = ""; // To store in history

  const propertyName = reminder.propertyName;
  const serviceType = reminder.serviceType;
  const scheduledDate = reminder.scheduledDate
    ? new Date(reminder.scheduledDate).toLocaleDateString("en-GB")
    : "Not Set";
  const keyPerson = reminder.keyPerson;
  const contact = reminder.contact;
  const location = reminder.location;

  switch (type) {
    case "overdue":
      message = `🚨 OVERDUE: ${propertyName} - ${serviceType} service was scheduled for ${scheduledDate}. Action required!`;
      urgency = "high";
      notificationType = "Overdue";
      break;
    case "due_today":
      message = `🔔 DUE TODAY: ${propertyName} - ${serviceType} service is scheduled for today, ${scheduledDate}.`;
      urgency = "normal";
      notificationType = "Due Today";
      break;
    case "upcoming_tomorrow":
      message = `🗓️ UPCOMING: ${propertyName} - ${serviceType} service is scheduled for tomorrow, ${scheduledDate}. Prepare for action!`;
      urgency = "normal";
      notificationType = "Upcoming Tomorrow";
      break;
    case "custom_followup":
      message = `⏰ FOLLOW-UP: ${propertyName} - ${serviceType} service. This is a custom reminder you set for ${reminder.customReminderHours} hours ago.`;
      urgency = "medium";
      notificationType = "Custom Follow-up";
      break;
    default:
      message = `Unknown reminder type for ${propertyName}.`;
      notificationType = "Unknown";
  }

  const fullMessage = `${message}\n📍 Location: ${location}\n👤 Contact: ${keyPerson} (${contact})`;

  console.log("=".repeat(60));
  console.log(`${urgency.toUpperCase()} NOTIFICATION - ${notificationType}`);
  console.log("=".repeat(60));
  console.log(fullMessage);
  console.log("=".repeat(60));

  // In a real application, you would integrate with a third-party service here.
  // For now, we're just logging to the console.

  // Mark as notified and update nextReminderTime for custom reminders
  const updateFields = {
    notificationSent: true,
    $push: {
      notificationHistory: {
        sentAt: new Date(),
        type: notificationType,
        message: fullMessage,
      },
    },
  };

  // For custom follow-ups, clear the nextReminderTime after sending
  if (type === "custom_followup") {
    updateFields.nextReminderTime = null;
    updateFields.customReminderHours = 0; // Reset custom hours
  }

  await Reminder.findByIdAndUpdate(reminder._id, updateFields);

  return true;
}

// SIMPLIFIED: Enhanced reminder formatting
function formatReminder(reminder, today) {
  let isOverdue = false;
  let isDueToday = false;
  let isScheduledOverdue = false; // ADD THIS
  let scheduledDateObj = null;

  if (reminder.completed) {
    return {
      ...reminder.toObject(),
      isOverdue: false,
      isDueToday: false,
      isScheduledOverdue: false, // ADD THIS
    };
  } else if (reminder.scheduledDate && reminder.status !== "on_hold") {
    scheduledDateObj = new Date(reminder.scheduledDate);
    scheduledDateObj.setHours(0, 0, 0, 0);
    isOverdue = scheduledDateObj < today;
    isDueToday = scheduledDateObj.toDateString() === today.toDateString();
    // isScheduledOverdue can be true if status is 'scheduled' but date is past
    isScheduledOverdue =
      reminder.status === "scheduled" && scheduledDateObj < today; // ADD THIS
  }

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
    scheduledDate: reminder.scheduledDate,
    status: reminder.status,
    called: reminder.called,
    scheduled: reminder.scheduled,
    completed: reminder.completed,
    notes: reminder.notes,
    isOverdue: isOverdue,
    isDueToday: isDueToday,
    isScheduledOverdue: isScheduledOverdue, // ADD THIS
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
