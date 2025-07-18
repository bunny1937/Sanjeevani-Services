// pages/api/reports.js
import connectDB from "../../lib/mongodb";
import mongoose from "mongoose";

// Define schemas
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

const PropertySchema = new mongoose.Schema(
  {
    name: String,
    keyPerson: String,
    contact: String,
    location: String,
    serviceType: String,
    amount: Number,
    lastService: String,
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

// Create models
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
const Property =
  mongoose.models.Property ||
  mongoose.model("Property", PropertySchema, "properties");
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
    const dailyBooks = await DailyBook.find({}).lean();

    return properties.map((property) => {
      // Find related daily book entries
      const relatedEntries = dailyBooks.filter(
        (entry) =>
          entry.property === property.name ||
          entry.keyPerson === property.keyPerson
      );

      // Calculate total amount from daily book entries
      const totalAmount = relatedEntries.reduce(
        (sum, entry) => sum + (entry.amount || 0),
        0
      );

      // Calculate next reminder (30 days from last service)
      const lastServiceDate = new Date(property.lastService);
      const nextReminder = new Date(lastServiceDate);
      nextReminder.setDate(nextReminder.getDate() + 30);

      return {
        propertyName: property.name,
        clientName: property.keyPerson,
        contact: property.contact,
        location: property.location,
        serviceType: property.serviceType,
        lastService: property.lastService,
        nextReminder: isNaN(nextReminder.getTime())
          ? ""
          : nextReminder.toISOString().split("T")[0],
        amount: totalAmount || property.amount,
        status: isOverdue(property.lastService) ? "Overdue" : "Active",
      };
    });
  } catch (error) {
    console.error("Client Report Error:", error);
    return [];
  }
}

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
    const dailyBooks = await DailyBook.find({}).lean();
    const expenses = await Expense.find({}).lean();

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Group data by month
    const monthlyData = {};

    // Process revenue
    dailyBooks.forEach((entry) => {
      const date = new Date(entry.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          expenses: 0,
          profit: 0,
          transactions: 0,
        };
      }

      monthlyData[monthKey].revenue += entry.amount || 0;
      monthlyData[monthKey].transactions++;
    });

    // Process expenses
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
          profit: 0,
          transactions: 0,
        };
      }

      monthlyData[monthKey].expenses += expense.amount || 0;
    });

    // Calculate profit for each month
    Object.keys(monthlyData).forEach((month) => {
      monthlyData[month].profit =
        monthlyData[month].revenue - monthlyData[month].expenses;
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

function isOverdue(lastServiceDate) {
  if (!lastServiceDate) return false;

  const lastService = new Date(lastServiceDate);
  const now = new Date();
  const daysDifference = Math.floor(
    (now - lastService) / (1000 * 60 * 60 * 24)
  );

  return daysDifference > 30; // Consider overdue if more than 30 days
}
