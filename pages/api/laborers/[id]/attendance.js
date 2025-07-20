// pages/api/laborers/[id]/attendance.js
import connectDB from "../../../../lib/mongodb.js";
import mongoose from "mongoose";

// Force clear all existing models to avoid schema conflicts
Object.keys(mongoose.models).forEach((modelName) => {
  if (modelName === "Attendance") {
    delete mongoose.models[modelName];
  }
});

// Also clear from connection models if it exists
if (mongoose.connection.models.Attendance) {
  delete mongoose.connection.models.Attendance;
}

// Attendance Schema - Updated to include holiday
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
      enum: ["present", "absent", "holiday"], // Updated enum with holiday
      required: true,
    },
    reason: {
      type: String,
      required: false, // Optional field for reasons (like holiday description)
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

// Force recreate the model with updated schema
const Attendance = mongoose.model("Attendance", AttendanceSchema, "attendance");

const Laborer =
  mongoose.models.Laborer ||
  mongoose.model("Laborer", LaborerSchema, "laborers");

export default async function handler(req, res) {
  try {
    await connectDB();

    const { id } = req.query;

    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    console.log("Laborer ID:", id);
    console.log("Request method:", req.method);
    console.log("Query params:", req.query);

    if (req.method === "GET") {
      const { month, year } = req.query;

      // Validate laborer ID format
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid laborer ID format",
          receivedId: id,
        });
      }

      // Check if laborer exists
      const laborer = await Laborer.findById(id);
      if (!laborer) {
        return res.status(404).json({
          success: false,
          message: "Laborer not found",
          laborerId: id,
        });
      }

      // Build query for attendance
      let query = { laborerId: new mongoose.Types.ObjectId(id) };

      if (month && year) {
        // Ensure month is 2 digits
        const monthStr = month.toString().padStart(2, "0");
        const startDate = `${year}-${monthStr}-01`;

        // Calculate end date properly
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${monthStr}-${lastDay
          .toString()
          .padStart(2, "0")}`;

        query.date = { $gte: startDate, $lte: endDate };
        console.log("Date range query:", query);
      }

      const attendanceRecords = await Attendance.find(query).lean();

      // Transform to the format expected by frontend
      const attendanceData = {};
      attendanceRecords.forEach((record) => {
        attendanceData[record.date] = {
          status: record.status,
          reason: record.reason || null,
        };
      });

      return res.status(200).json({
        success: true,
        data: attendanceData,
        totalRecords: attendanceRecords.length,
        laborer: {
          id: laborer._id,
          name: laborer.name,
        },
      });
    }

    if (req.method === "POST") {
      const { date, status, reason } = req.body;

      console.log("Received POST data:", { date, status, reason });

      // Validate input
      if (!date || !status) {
        return res.status(400).json({
          success: false,
          message: "Date and status are required",
        });
      }

      // Updated validation to include holiday
      if (!["present", "absent", "holiday"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'present', 'absent', or 'holiday'",
        });
      }

      // Validate laborer ID
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid laborer ID format",
          receivedId: id,
        });
      }

      // Check if laborer exists
      const laborer = await Laborer.findById(id);
      if (!laborer) {
        return res.status(404).json({
          success: false,
          message: "Laborer not found",
          laborerId: id,
        });
      }

      // Check if attendance already exists for this date
      const existingAttendance = await Attendance.findOne({
        laborerId: new mongoose.Types.ObjectId(id),
        date: date,
      });

      let previousStatus = null;

      if (existingAttendance) {
        // Update existing attendance
        previousStatus = existingAttendance.status;
        existingAttendance.status = status;
        if (reason) {
          existingAttendance.reason = reason;
        }
        await existingAttendance.save();
        console.log("Updated existing attendance:", existingAttendance);
      } else {
        // Create new attendance record
        const attendanceData = {
          laborerId: new mongoose.Types.ObjectId(id),
          date: date,
          status: status,
        };
        if (reason) {
          attendanceData.reason = reason;
        }
        const newAttendance = await Attendance.create(attendanceData);
        console.log("Created new attendance:", newAttendance);
      }

      // Update laborer's days worked based on status change
      if (previousStatus !== status) {
        if (status === "present") {
          if (previousStatus === "absent" || previousStatus === "holiday") {
            // Changed from absent/holiday to present
            laborer.daysWorked = (laborer.daysWorked || 0) + 1;
          } else if (previousStatus === null) {
            // New attendance marked as present
            laborer.daysWorked = (laborer.daysWorked || 0) + 1;
          }
        } else if (
          (status === "absent" || status === "holiday") &&
          previousStatus === "present"
        ) {
          // Changed from present to absent/holiday
          laborer.daysWorked = Math.max(0, (laborer.daysWorked || 0) - 1);
        }
        // Note: Holiday to absent or absent to holiday doesn't change daysWorked
      }

      // Update laborer's last attendance
      laborer.lastAttendance = date;
      await laborer.save();

      return res.status(200).json({
        success: true,
        message: "Attendance marked successfully",
        data: {
          date,
          status,
          reason: reason || null,
          previousStatus,
          laborerId: id,
        },
      });
    }

    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  } catch (error) {
    console.error("Attendance API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}
