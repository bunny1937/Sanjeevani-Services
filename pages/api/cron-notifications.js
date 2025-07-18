// pages/api/cron-notifications.js
import connectDB from "../../lib/mongodb";
import mongoose from "mongoose";

// Use the same schema as your main reminders API
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
    lastServiceDate: { type: Date, default: null },
    dueDate: { type: Date, required: true },
    scheduledDate: { type: Date, default: null },
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

// Ensure we use the same model
const Reminder =
  mongoose.models.Reminder || mongoose.model("Reminder", ReminderSchema);

export default async function handler(req, res) {
  // Verify this is a cron job request (optional security)
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await connectDB();

    console.log("🔄 Cron job triggered at:", new Date().toISOString());

    await checkAndSendNotifications();

    res.status(200).json({
      message: "Notification check completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    res.status(500).json({
      message: "Cron job failed",
      error: error.message,
    });
  }
}

async function checkAndSendNotifications() {
  try {
    const now = new Date();

    // Find all reminders due for notification
    const dueReminders = await Reminder.find({
      nextReminderTime: { $lte: now },
      notificationSent: false,
      completed: false,
    });

    console.log(
      `📋 Found ${dueReminders.length} reminders due for notification`
    );

    for (const reminder of dueReminders) {
      // Determine notification type
      const dueDate = new Date(reminder.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let notificationType = "due";
      if (dueDate < today) {
        notificationType = "overdue";
      } else if (reminder.customReminderHours > 0) {
        notificationType = "custom";
      }

      // Send notification
      await sendNotification(reminder, notificationType);

      // Mark as notified and add to history
      await Reminder.findByIdAndUpdate(reminder._id, {
        notificationSent: true,
        $push: {
          notificationHistory: {
            sentAt: now,
            type: notificationType,
            message: `${notificationType.toUpperCase()} notification sent for ${
              reminder.propertyName
            }`,
          },
        },
      });

      console.log(
        `✅ Notification sent for: ${reminder.propertyName} - ${reminder.serviceType}`
      );
    }

    // Also check for overdue reminders that need re-notification (every 24 hours)
    await checkOverdueReminders();
  } catch (error) {
    console.error("❌ Error in notification check:", error);
  }
}

async function checkOverdueReminders() {
  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find overdue reminders that haven't been notified in 24 hours
    const overdueReminders = await Reminder.find({
      dueDate: { $lt: yesterday },
      completed: false,
      scheduled: false,
      $or: [
        { "notificationHistory.0": { $exists: false } },
        { "notificationHistory.0.sentAt": { $lt: yesterday } },
      ],
    });

    console.log(
      `⚠️  Found ${overdueReminders.length} overdue reminders needing re-notification`
    );

    for (const reminder of overdueReminders) {
      await sendNotification(reminder, "overdue");

      await Reminder.findByIdAndUpdate(reminder._id, {
        $push: {
          notificationHistory: {
            sentAt: now,
            type: "overdue",
            message: `OVERDUE re-notification for ${reminder.propertyName}`,
          },
        },
      });

      console.log(`🔔 Overdue notification sent for: ${reminder.propertyName}`);
    }
  } catch (error) {
    console.error("❌ Error checking overdue reminders:", error);
  }
}

async function sendNotification(reminder, type) {
  const daysOverdue = Math.ceil(
    (new Date() - new Date(reminder.dueDate)) / (1000 * 60 * 60 * 24)
  );

  let message = "";
  let urgency = "";

  switch (type) {
    case "overdue":
      urgency = "🚨 URGENT - OVERDUE";
      message = `${urgency}: ${reminder.propertyName} service is ${daysOverdue} days overdue!`;
      break;
    case "due":
      urgency = "🔔 DUE TODAY";
      message = `${urgency}: ${reminder.propertyName} service is due today!`;
      break;
    case "custom":
      urgency = "⏰ CUSTOM REMINDER";
      message = `${urgency}: Follow up on ${reminder.propertyName} (${reminder.customReminderHours}h reminder)`;
      break;
    default:
      urgency = "📅 REMINDER";
      message = `${urgency}: ${reminder.propertyName} service reminder`;
  }

  const fullMessage = `
${message}

📍 Property: ${reminder.propertyName}
🏠 Location: ${reminder.location}
🛠️  Service: ${reminder.serviceType}
👤 Contact: ${reminder.keyPerson}
📞 Phone: ${reminder.contact}
📅 Due Date: ${new Date(reminder.dueDate).toLocaleDateString("en-GB")}
${reminder.notes ? `📝 Notes: ${reminder.notes}` : ""}

${
  type === "overdue"
    ? "⚠️  This service is overdue and requires immediate attention!"
    : ""
}
`;

  console.log("=".repeat(60));
  console.log("📢 NOTIFICATION TRIGGERED!");
  console.log("=".repeat(60));
  console.log(fullMessage);
  console.log("=".repeat(60));

  // Here you can implement actual notification methods:

  // 1. EMAIL NOTIFICATION (using nodemailer)
  // await sendEmailNotification(reminder, message);

  // 2. SMS NOTIFICATION (using Twilio)
  // await sendSMSNotification(reminder, message);

  // 3. WHATSAPP NOTIFICATION (using WhatsApp Business API)
  // await sendWhatsAppNotification(reminder, message);

  // 4. PUSH NOTIFICATION (using Firebase)
  // await sendPushNotification(reminder, message);

  // 5. DESKTOP NOTIFICATION (using node-notifier)
  // await sendDesktopNotification(reminder, message);

  // 6. SLACK/DISCORD NOTIFICATION (using webhooks)
  // await sendSlackNotification(reminder, message);

  return true;
}

// Example email notification function (uncomment and configure)
/*
async function sendEmailNotification(reminder, message) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `Service Reminder: ${reminder.propertyName}`,
    text: message
  };
  
  await transporter.sendMail(mailOptions);
}
*/

// Example SMS notification function (uncomment and configure)
/*
async function sendSMSNotification(reminder, message) {
  const twilio = require('twilio');
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: process.env.NOTIFICATION_PHONE
  });
}
*/
