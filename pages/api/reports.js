// pages/api/reports.js
import connectDB from "../../lib/mongodb";
import mongoose from "mongoose";

// Define schemas (UPDATED PropertySchema and added ReminderSchema)
const DailyBookSchema = new mongoose.Schema(
  {
    date: String,
    property: String,
    keyPerson: String,
    contact: String,
    location: String,
    service: String,
    amount: Number,
    remarks: String,
  },
  { timestamps: true }
);

const ExpenseSchema = new mongoose.Schema(
  {
    date: String,
    type: String,
    amount: Number,
    description: String,
  },
  { timestamps: true }
);

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

const AttendanceSchema = new mongoose.Schema(
  {
    laborerId: String,
    date: String,
    status: String,
  },
  { timestamps: true }
);

// UPDATED PropertySchema to match pages/api/properties.js
const PropertySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    keyPerson: { type: String, required: true },
    contact: { type: String, required: true },
    location: { type: String, required: true },
    area: { type: String, required: false },
    serviceType: { type: String, required: true },
    amount: { type: Number, required: true },
    isOnHold: { type: Boolean, default: false },
    serviceDate: { type: Date, required: false, default: null },
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

// ADDED ReminderSchema
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
    scheduledDate: { type: Date, required: false, default: null },
    nextReminderTime: { type: Date, required: false, default: null },
    status: {
      type: String,
      enum: ["pending", "called", "scheduled", "completed", "on_hold"],
      default: "scheduled",
    },
    called: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: true },
    completed: { type: Boolean, default: false },
    isNewService: { type: Boolean, default: true },
    callAttempts: { type: Number, default: 0 },
    lastCallAttempt: { type: Date },
    escalationLevel: { type: Number, default: 0 },
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

const ServiceSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    defaultPrice: Number,
    active: Boolean,
  },
  { timestamps: true }
);

// Create models (ensure models are not re-created if already defined)
const DailyBook =
  mongoose.models.DailyBook ||
  mongoose.model("DailyBook", DailyBookSchema, "dailybooks");
const Expense =
  mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema, "expenses");
const Laborer =
  mongoose.models.Laborer ||
  mongoose.model("Laborer", LaborerSchema, "laborers");
const Attendance =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema, "attendance");

// Force recreation for Property and Reminder to ensure latest schema is used
delete mongoose.models.Property;
delete mongoose.models.Reminder;

const Property = mongoose.model("Property", PropertySchema, "properties");
const Reminder = mongoose.model("Reminder", ReminderSchema); // Use the new Reminder model

const Service =
  mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema, "services");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      const { type } = req.query;

      let reportData = [];

      switch (type) {
        case "Client Report":
          reportData = await generateClientReport();
          break;
        case "Service Report":
          reportData = await generateServiceReport();
          break;
        case "Financial Report":
          reportData = await generateFinancialReport();
          break;
        case "Labor Report":
          reportData = await generateLaborReport();
          break;
        default:
          reportData = await generateClientReport();
      }

      res.status(200).json(reportData);
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Reports API Error:", error);
    res
      .status(500)
      .json({ message: "Error handling reports", error: error.message });
  }
}

async function generateClientReport() {
  try {
    const properties = await Property.find({}).lean();
    const dailyBooks = await DailyBook.find({}).lean(); // Still useful for total amount calculation

    const clientReportData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const property of properties) {
      // Find the latest relevant reminder for this property
      // Prioritize non-completed reminders, then the most recently completed one
      const latestReminder = await Reminder.findOne({
        propertyId: property._id,
        // Find non-completed first, or the most recent completed one
        $or: [
          { completed: false },
          {
            completed: true,
            updatedAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          }, // Completed within last 30 days
        ],
      })
        .sort({ completed: 1, scheduledDate: -1, updatedAt: -1 })
        .lean(); // Non-completed first, then latest scheduled/updated

      let lastServiceDisplay = "N/A";
      let nextReminderDisplay = "N/A";
      let statusDisplay = "Unknown";

      if (latestReminder) {
        // Determine Last Service
        if (latestReminder.lastServiceDate) {
          lastServiceDisplay = new Date(
            latestReminder.lastServiceDate
          ).toLocaleDateString("en-GB");
        } else if (latestReminder.isNewService) {
          lastServiceDisplay = "New Service";
        }

        // Determine Next Reminder and Status based on Reminder data
        if (latestReminder.completed) {
          nextReminderDisplay = "Completed";
          statusDisplay = "Completed";
        } else if (latestReminder.status === "on_hold") {
          nextReminderDisplay = "On Hold";
          statusDisplay = "On Hold";
        } else if (latestReminder.scheduledDate) {
          const scheduledDateObj = new Date(latestReminder.scheduledDate);
          scheduledDateObj.setHours(0, 0, 0, 0);

          nextReminderDisplay = scheduledDateObj.toLocaleDateString("en-GB");

          if (scheduledDateObj < today) {
            statusDisplay = "Overdue";
          } else if (scheduledDateObj.toDateString() === today.toDateString()) {
            statusDisplay = "Due Today";
          } else {
            statusDisplay = "Scheduled";
          }
        } else {
          statusDisplay = "Pending"; // No scheduled date, not on hold, not completed
        }
      } else {
        // Fallback if no reminder exists for the property
        // This might happen for older properties or if reminder generation failed
        lastServiceDisplay = property.serviceDate
          ? new Date(property.serviceDate).toLocaleDateString("en-GB")
          : "N/A";
        nextReminderDisplay = property.isOnHold
          ? "On Hold"
          : property.serviceDate
          ? new Date(property.serviceDate).toLocaleDateString("en-GB")
          : "N/A";
        statusDisplay = property.isOnHold ? "On Hold" : "Active (No Reminder)";
      }

      // Calculate total amount from daily book entries (still relevant)
      const relatedEntries = dailyBooks.filter(
        (entry) =>
          entry.property === property.name ||
          entry.keyPerson === property.keyPerson
      );
      const totalAmount = relatedEntries.reduce(
        (sum, entry) => sum + (entry.amount || 0),
        0
      );

      clientReportData.push({
        propertyName: property.name,
        clientName: property.keyPerson,
        contact: property.contact,
        location: property.location,
        serviceType: property.serviceType,
        lastService: lastServiceDisplay,
        nextReminder: nextReminderDisplay,
        amount: totalAmount || property.amount, // Use total from daily books if available, else property's default amount
        status: statusDisplay,
      });
    }

    return clientReportData;
  } catch (error) {
    console.error("Client Report Error:", error);
    return [];
  }
}

// Keep other report generation functions as they are
async function generateServiceReport() {
  try {
    const services = await Service.find({}).lean();
    const dailyBooks = await DailyBook.find({}).lean();

    return services.map((service) => {
      // Find related daily book entries
      const relatedEntries = dailyBooks.filter(
        (entry) => entry.service === service.name
      );

      // Calculate statistics
      const totalBookings = relatedEntries.length;
      const totalRevenue = relatedEntries.reduce(
        (sum, entry) => sum + (entry.amount || 0),
        0
      );
      const averageAmount =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Get recent bookings
      const recentBookings = relatedEntries
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      return {
        serviceName: service.name,
        description: service.description,
        defaultPrice: service.defaultPrice,
        status: service.active ? "Active" : "Inactive",
        totalBookings,
        totalRevenue,
        averageAmount: Math.round(averageAmount),
        recentBookings: recentBookings.map((booking) => ({
          date: booking.date,
          property: booking.property,
          amount: booking.amount,
        })),
      };
    });
  } catch (error) {
    console.error("Service Report Error:", error);
    return [];
  }
}

async function generateFinancialReport() {
  try {
    const expenses = await Expense.find({}).lean();
    const laborers = await Laborer.find({ status: "Active" }).lean();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Group data by month
    const monthlyData = {};

    // Process regular expenses
    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          laborExpenses: 0,
          variableLaborExpenses: 0,
          profit: 0,
          transactions: 1,
          expenseBreakdown: {},
          topExpenses: [],
          expenseCategories: {},
          profitMargin: 0,
        };
      } else {
        monthlyData[monthKey].transactions++;
      }

      monthlyData[monthKey].expenses += expense.amount || 0;

      const expenseType = expense.type || "Other";
      if (expenseType.toLowerCase() === "labor") {
        monthlyData[monthKey].variableLaborExpenses += expense.amount || 0;
        monthlyData[monthKey].expenseBreakdown["Variable Labor"] =
          (monthlyData[monthKey].expenseBreakdown["Variable Labor"] || 0) +
          (expense.amount || 0);
      } else {
        monthlyData[monthKey].expenseBreakdown[expenseType] =
          (monthlyData[monthKey].expenseBreakdown[expenseType] || 0) +
          (expense.amount || 0);
      }

      let categoryType = expenseType;
      if (expenseType.toLowerCase() === "labor") {
        categoryType = "Labor Variable";
      } else if (
        expenseType.toLowerCase() === "transportation" ||
        expenseType === "Transportation"
      ) {
        categoryType = "Transportation";
      } else if (
        expenseType.toLowerCase() === "miscellaneous" ||
        expenseType === "Miscellaneous"
      ) {
        categoryType = "Miscellaneous";
      } else {
        // Map any other expense types to Miscellaneous
        categoryType = "Miscellaneous";
      }

      monthlyData[monthKey].topExpenses.push({
        type: expenseType === "Labor" ? "Labor Variable" : expenseType,
        amount: expense.amount || 0,
        description: expense.description || "",
        date: expense.date,
      });
    });

    // Calculate labor expenses for each month
    for (const monthKey of Object.keys(monthlyData)) {
      const [year, month] = monthKey.split("-");
      const monthStart = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const monthEnd = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

      let monthLaborExpenses = 0;
      let monthAttendance = [];
      let laborerMap = new Map();

      const laborerIds = laborers.map((l) => l._id);

      if (laborerIds.length > 0) {
        monthAttendance = await Attendance.find({
          laborerId: { $in: laborerIds },
          date: { $gte: monthStart, $lte: monthEnd },
          status: "present",
        }).lean();

        laborerMap = new Map(laborers.map((l) => [l._id.toString(), l]));

        monthAttendance.forEach((record) => {
          const laborer = laborerMap.get(record.laborerId.toString());
          if (laborer && laborer.monthlyPay) {
            monthLaborExpenses += laborer.monthlyPay / lastDay;
          }
        });
      }

      monthlyData[monthKey].laborExpenses = monthLaborExpenses;
      monthlyData[monthKey].expenseBreakdown["Salary Expenses"] =
        monthLaborExpenses;

      // Group salary by laborer for better breakdown
      if (monthLaborExpenses > 0) {
        const salaryBreakdown = {};

        monthAttendance.forEach((record) => {
          const laborer = laborerMap.get(record.laborerId.toString());
          if (laborer && laborer.monthlyPay) {
            if (!salaryBreakdown[laborer.name]) {
              salaryBreakdown[laborer.name] = 0;
            }
            salaryBreakdown[laborer.name] += laborer.monthlyPay / lastDay;
          }
        });

        Object.entries(salaryBreakdown).forEach(([laborerName, amount]) => {
          monthlyData[monthKey].topExpenses.push({
            type: "Labor Salary",
            amount,
            description: `Monthly salary for ${laborerName}`,
            date: `${monthKey}-01`,
          });
        });
      }
    }

    // Final calculations for each month
    Object.keys(monthlyData).forEach((month) => {
      const data = monthlyData[month];
      const totalExpenses = data.expenses + data.laborExpenses;
      data.profit = -totalExpenses;
      data.profitMargin = -100;

      data.topExpenses = data.topExpenses.sort((a, b) => b.amount - a.amount);

      const expenseTotal = Object.values(data.expenseBreakdown).reduce(
        (sum, amount) => sum + amount,
        0
      );

      data.expenseCategories = Object.entries(data.expenseBreakdown)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      data.laborBreakdown = {
        salaryExpenses: data.laborExpenses || 0,
        variableExpenses: data.variableLaborExpenses || 0,
        totalLabor:
          (data.laborExpenses || 0) + (data.variableLaborExpenses || 0),
      };

      data.expenses = totalExpenses;
    });

    // Convert to array and sort by date
    const financialData = Object.values(monthlyData)
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Last 12 months

    return financialData;
  } catch (error) {
    console.error("Financial Report Error:", error);
    return [];
  }
}

async function generateLaborReport() {
  try {
    const laborers = await Laborer.find({}).lean();
    const attendance = await Attendance.find({}).lean();

    return laborers.map((laborer) => {
      // Get attendance records for this laborer
      const laborerAttendance = attendance.filter(
        (record) => record.laborerId === laborer._id.toString()
      );

      // Calculate current month attendance
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentMonthAttendance = laborerAttendance.filter((record) => {
        const date = new Date(record.date);
        return (
          date.getMonth() === currentMonth && date.getFullYear() === currentYear
        );
      });

      const presentDays = currentMonthAttendance.filter(
        (record) => record.status === "present"
      ).length;
      const absentDays = currentMonthAttendance.filter(
        (record) => record.status === "absent"
      ).length;
      const totalDays = currentMonthAttendance.length;
      const attendancePercentage =
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Calculate salary details
      const dailyWage = laborer.monthlyPay / 30; // Assuming 30 days per month
      const currentSalary = presentDays * dailyWage;

      return {
        name: laborer.name,
        phone: laborer.phone,
        joiningDate: laborer.joiningDate,
        status: laborer.status,
        monthlyPay: laborer.monthlyPay,
        lastAttendance: laborer.lastAttendance,
        currentMonthStats: {
          presentDays,
          absentDays,
          totalDays,
          attendancePercentage,
          currentSalary: Math.round(currentSalary),
        },
        overallStats: {
          totalDaysWorked: laborer.daysWorked,
          joiningDaysAgo: Math.floor(
            (now - new Date(laborer.joiningDate)) / (1000 * 60 * 60 * 24)
          ),
        },
      };
    });
  } catch (error) {
    console.error("Labor Report Error:", error);
    return [];
  }
}

// This function is no longer directly used in generateClientReport but kept for reference if needed elsewhere
function isOverdue(lastServiceDate) {
  if (!lastServiceDate) return false;

  const lastService = new Date(lastServiceDate);
  const now = new Date();
  const daysDifference = Math.floor(
    (now - lastService) / (1000 * 60 * 60 * 24)
  );

  return daysDifference > 30; // Consider overdue if more than 30 days
}
