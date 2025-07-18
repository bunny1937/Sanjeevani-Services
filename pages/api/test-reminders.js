import connectDB from "../../lib/mongodb";
import mongoose from "mongoose";

// Your existing Reminder schema
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
      default: "pending",
    },
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: false },
    completed: { type: Boolean, default: false },
    notes: { type: String },
    customReminderHours: { type: Number, default: 0 },
    // Add this field for notifications
    notificationSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

delete mongoose.models.Reminder;
const Reminder = mongoose.model("Reminder", ReminderSchema);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      await connectDB();

      const now = new Date();
      const testTimes = [
        { label: "30 seconds", time: new Date(now.getTime() + 30 * 1000) },
        { label: "1 minute", time: new Date(now.getTime() + 60 * 1000) },
        { label: "2 minutes", time: new Date(now.getTime() + 2 * 60 * 1000) },
        { label: "5 minutes", time: new Date(now.getTime() + 5 * 60 * 1000) },
      ];

      const testReminders = [];

      for (let i = 0; i < testTimes.length; i++) {
        const testTime = testTimes[i];
        const reminder = await Reminder.create({
          propertyName: `Test Property ${i + 1}`,
          keyPerson: `Test Person ${i + 1}`,
          contact: `+123456789${i}`,
          location: `Test Location ${i + 1}`,
          serviceType: `Test Service ${i + 1}`,
          dueDate: testTime.time,
          nextReminderTime: testTime.time,
          status: "pending",
          scheduled: false,
          completed: false,
          propertyId: new mongoose.Types.ObjectId(),
          notificationSent: false,
        });

        testReminders.push({
          id: reminder._id,
          name: reminder.propertyName,
          dueIn: testTime.label,
          dueTime: testTime.time,
        });
      }

      res.json({
        success: true,
        message: "Test reminders created!",
        reminders: testReminders,
        currentTime: now,
      });
    } catch (error) {
      console.error("Test reminder creation error:", error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
