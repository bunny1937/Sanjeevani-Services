// pages/api/attendance/report.js
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

    if (req.method === "GET") {
      const { laborerId, month, year, startDate, endDate } = req.query;

      let query = {};

      // Filter by laborer if provided
      if (laborerId) {
        query.laborerId = laborerId;
      }

      // Filter by date range
      if (startDate && endDate) {
        query.date = { $gte: startDate, $lte: endDate };
      } else if (month && year) {
        const startDate = `${year}-${month.padStart(2, "0")}-01`;
        const endDate = `${year}-${month.padStart(2, "0")}-31`;
        query.date = { $gte: startDate, $lte: endDate };
      }

      // Get attendance records with laborer details
      const attendanceRecords = await Attendance.find(query)
        .populate("laborerId", "name phone")
        .lean();

      // If getting report for a specific laborer, return calendar format
      if (laborerId) {
        const attendanceData = {};
        attendanceRecords.forEach((record) => {
          attendanceData[record.date] = record.status;
        });

        return res.status(200).json(attendanceData);
      }

      // Otherwise, return detailed report
      const report = {
        attendanceRecords: attendanceRecords,
        summary: {
          totalRecords: attendanceRecords.length,
          presentCount: attendanceRecords.filter((r) => r.status === "present")
            .length,
          absentCount: attendanceRecords.filter((r) => r.status === "absent")
            .length,
        },
      };

      return res.status(200).json(report);
    }

    if (req.method === "POST") {
      // Generate attendance report for a specific period
      const { startDate, endDate, laborerIds } = req.body;

      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Start date and end date are required",
        });
      }

      let query = {
        date: { $gte: startDate, $lte: endDate },
      };

      // Filter by specific laborers if provided
      if (laborerIds && laborerIds.length > 0) {
        query.laborerId = { $in: laborerIds };
      }

      const attendanceRecords = await Attendance.find(query)
        .populate("laborerId", "name phone monthlyPay")
        .lean();

      // Group by laborer
      const reportByLaborer = {};
      attendanceRecords.forEach((record) => {
        const laborerId = record.laborerId._id.toString();

        if (!reportByLaborer[laborerId]) {
          reportByLaborer[laborerId] = {
            laborer: record.laborerId,
            presentDays: 0,
            absentDays: 0,
            totalDays: 0,
            attendanceRate: 0,
            records: [],
          };
        }

        reportByLaborer[laborerId].records.push({
          date: record.date,
          status: record.status,
        });

        if (record.status === "present") {
          reportByLaborer[laborerId].presentDays++;
        } else {
          reportByLaborer[laborerId].absentDays++;
        }

        reportByLaborer[laborerId].totalDays++;
      });

      // Calculate attendance rates
      Object.values(reportByLaborer).forEach((laborerReport) => {
        if (laborerReport.totalDays > 0) {
          laborerReport.attendanceRate = (
            (laborerReport.presentDays / laborerReport.totalDays) *
            100
          ).toFixed(2);
        }
      });

      const report = {
        period: { startDate, endDate },
        laborers: Object.values(reportByLaborer),
        summary: {
          totalLaborers: Object.keys(reportByLaborer).length,
          totalRecords: attendanceRecords.length,
          averageAttendanceRate:
            Object.values(reportByLaborer).reduce(
              (sum, l) => sum + parseFloat(l.attendanceRate),
              0
            ) / Object.keys(reportByLaborer).length || 0,
        },
      };

      return res.status(200).json(report);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Attendance Report API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
