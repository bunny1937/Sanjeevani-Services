// pages/api/laborers/[id]/attendance.js
import connectDB from "../../../../lib/mongodb.js";
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
      console.log("Found attendance records:", attendanceRecords.length);

      // Transform to the format expected by frontend
      const attendanceData = {};
      attendanceRecords.forEach((record) => {
        attendanceData[record.date] = record.status;
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
      const { date, status } = req.body;

      // Validate input
      if (!date || !status) {
        return res.status(400).json({
          success: false,
          message: "Date and status are required",
        });
      }

      if (!["present", "absent"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be 'present' or 'absent'",
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
        await existingAttendance.save();
      } else {
        // Create new attendance record
        await Attendance.create({
          laborerId: new mongoose.Types.ObjectId(id),
          date: date,
          status: status,
        });
      }

      // Update laborer's days worked based on status change
      if (previousStatus !== status) {
        if (status === "present") {
          if (previousStatus === "absent") {
            // Changed from absent to present
            laborer.daysWorked = (laborer.daysWorked || 0) + 1;
          } else if (previousStatus === null) {
            // New attendance marked as present
            laborer.daysWorked = (laborer.daysWorked || 0) + 1;
          }
        } else if (status === "absent" && previousStatus === "present") {
          // Changed from present to absent
          laborer.daysWorked = Math.max(0, (laborer.daysWorked || 0) - 1);
        }
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
