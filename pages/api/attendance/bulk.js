// pages/api/attendance/bulk.js
import connectDB from "../../../lib/mongodb.js";
import mongoose from "mongoose";

// Attendance Schema
const AttendanceSchema = new mongoose.Schema(
  {
    laborerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laborer",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
  },
  { timestamps: true }
);

// Laborer Schema
const LaborerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    joiningDate: String,
    daysWorked: Number,
    monthlyPay: Number,
    lastAttendance: String,
    status: String,
  },
  { timestamps: true }
);

const Attendance =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema, "attendance");

const Laborer =
  mongoose.models.Laborer ||
  mongoose.model("Laborer", LaborerSchema, "laborers");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "POST") {
      const { date, attendanceData } = req.body;

      if (!date || !attendanceData || !Array.isArray(attendanceData)) {
        return res.status(400).json({
          message: "Date and attendanceData array are required",
        });
      }

      // Process each attendance record
      const bulkOperations = [];
      const laborerUpdates = [];

      for (const { laborerId, status } of attendanceData) {
        if (!laborerId || !status) {
          continue;
        }

        // Prepare bulk upsert operation for attendance
        bulkOperations.push({
          updateOne: {
            filter: { laborerId: laborerId, date: date },
            update: {
              $set: {
                laborerId: laborerId,
                date: date,
                status: status,
              },
            },
            upsert: true,
          },
        });

        // Prepare laborer update
        laborerUpdates.push({
          laborerId: laborerId,
          status: status,
          date: date,
        });
      }

      // Execute bulk attendance operations
      if (bulkOperations.length > 0) {
        await Attendance.bulkWrite(bulkOperations);
      }

      // Update laborers' last attendance and days worked
      for (const { laborerId, status, date } of laborerUpdates) {
        try {
          const laborer = await Laborer.findById(laborerId);
          if (laborer) {
            // Check if this is a new attendance record
            const existingAttendance = await Attendance.findOne({
              laborerId: laborerId,
              date: date,
            });

            // Update last attendance
            laborer.lastAttendance = date;

            // Update days worked based on status
            if (status === "present") {
              // Only increment if this is a new present record or changed from absent
              const previousAttendance = await Attendance.findOne({
                laborerId: laborerId,
                date: date,
              });

              if (
                !previousAttendance ||
                previousAttendance.status === "absent"
              ) {
                laborer.daysWorked = (laborer.daysWorked || 0) + 1;
              }
            }

            await laborer.save();
          }
        } catch (error) {
          console.error(`Error updating laborer ${laborerId}:`, error);
        }
      }

      return res.status(200).json({
        message: "Bulk attendance marked successfully",
        processedRecords: attendanceData.length,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Bulk Attendance API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
