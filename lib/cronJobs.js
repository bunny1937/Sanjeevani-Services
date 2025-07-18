// lib/cronJobs.js - Create this new file
const cron = require("node-cron");

// Import your notification functions
const { sendWhatsAppMessage, formatWhatsAppMessage } = require("./whatsapp");

// Function to check reminders and send notifications
async function checkAndNotifyReminders() {
  try {
    console.log("🔍 Checking for reminders...", new Date().toISOString());

    // Make API call to your reminders endpoint
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/reminders`
    );
    const data = await response.json();

    // Process overdue reminders
    if (data.overdueReminders && data.overdueReminders.length > 0) {
      console.log(`🚨 Found ${data.overdueReminders.length} overdue reminders`);

      for (const reminder of data.overdueReminders) {
        const message = formatWhatsAppMessage(reminder, "overdue");

        // Send WhatsApp notification
        try {
          await sendWhatsAppMessage(message);
          console.log(
            `✅ Sent overdue notification for ${reminder.propertyName}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to send notification for ${reminder.propertyName}:`,
            error
          );
        }
      }
    }

    // Process today's reminders
    if (data.reminders && data.reminders.length > 0) {
      console.log(`📅 Found ${data.reminders.length} reminders for today`);

      for (const reminder of data.reminders) {
        const message = formatWhatsAppMessage(reminder, "due_today");

        try {
          await sendWhatsAppMessage(message);
          console.log(
            `✅ Sent today's notification for ${reminder.propertyName}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to send notification for ${reminder.propertyName}:`,
            error
          );
        }
      }
    }

    if (data.overdueReminders?.length === 0 && data.reminders?.length === 0) {
      console.log("✨ No reminders need notifications at this time");
    }
  } catch (error) {
    console.error("❌ Error in cron job:", error);
  }
}

// Set up cron jobs
function startCronJobs() {
  console.log("🚀 Starting cron jobs...");

  // Check every 30 minutes during business hours (9 AM to 6 PM, weekdays)
  cron.schedule(
    "*/30 9-18 * * 1-5",
    () => {
      console.log("⏰ Running business hours reminder check...");
      checkAndNotifyReminders();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata", // Change to your timezone
    }
  );

  // Check every 2 hours on weekends
  cron.schedule(
    "0 */2 * * 6,0",
    () => {
      console.log("⏰ Running weekend reminder check...");
      checkAndNotifyReminders();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );

  // Daily morning summary at 9 AM
  cron.schedule(
    "0 9 * * 1-5",
    () => {
      console.log("⏰ Running morning summary...");
      checkAndNotifyReminders();
    },
    {
      scheduled: true,
      timezone: "Asia/Kolkata",
    }
  );

  console.log("✅ Cron jobs started successfully");
}

// Export the functions
module.exports = {
  startCronJobs,
  checkAndNotifyReminders,
};

// If running this file directly (for testing)
if (require.main === module) {
  checkAndNotifyReminders();
}

// ADD THIS TO YOUR pages/api/reminders.js (at the very bottom, after all functions)

// ADD THIS IMPORT AT THE TOP OF pages/api/reminders.js
const { startCronJobs } = require("../../lib/cronJobs");

// ADD THIS INITIALIZATION (add this code at the very bottom of the file)
// Initialize cron jobs when the server starts
if (typeof global.cronJobsStarted === "undefined") {
  global.cronJobsStarted = true;
  startCronJobs();
}

// OR CREATE A SEPARATE API ENDPOINT: pages/api/cron/check-reminders.js
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { checkAndNotifyReminders } = require("../../../lib/cronJobs");
    await checkAndNotifyReminders();

    res.status(200).json({
      message: "Reminder check completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    res.status(500).json({
      message: "Error running reminder check",
      error: error.message,
    });
  }
}
