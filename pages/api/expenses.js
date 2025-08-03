// pages/api/expenses.js - COMPLETELY FIXED VERSION
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// [Schemas remain the same]
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

const ExpenseSchema = new mongoose.Schema(
  {
    date: String,
    type: String,
    amount: Number,
    description: String,
  },
  { timestamps: true }
);

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
      enum: ["present", "absent", "holiday"],
      required: true,
    },
    reason: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const Expense =
  mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema, "expenses");
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
      if (req.query.stats === "true") {
        const { date, period } = req.query;

        const expenses = await Expense.find({}).lean();
        const laborers = await Laborer.find({ status: "Active" }).lean();

        const targetDate = date ? new Date(date) : new Date();
        const parseDate = (dateStr) => {
          if (!dateStr) return null;
          let date;
          try {
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              date = new Date(dateStr + "T00:00:00.000Z");
            } else if (
              dateStr.includes("/") &&
              dateStr.split("/").length === 3
            ) {
              const parts = dateStr.split("/");
              if (parts[0].length === 4) {
                date = new Date(parts[0], parts[1] - 1, parts[2]);
              } else if (parts[2].length === 4) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            } else {
              date = new Date(dateStr);
            }
            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            console.error("Date parsing error:", dateStr, error);
            return null;
          }
        };

        const dateMatches = (itemDate, targetDate, period) => {
          const parsedItemDate = parseDate(itemDate);
          if (!parsedItemDate) return false;

          switch (period) {
            case "daily":
              return (
                parsedItemDate.toDateString() === targetDate.toDateString()
              );
            case "monthly":
              return (
                parsedItemDate.getMonth() === targetDate.getMonth() &&
                parsedItemDate.getFullYear() === targetDate.getFullYear()
              );
            case "yearly":
              return parsedItemDate.getFullYear() === targetDate.getFullYear();
            default:
              return true;
          }
        };

        // ===== COMPLETELY REWRITTEN LABOR EXPENSE CALCULATION =====

        const calculateLaborExpenses = async (startDate, endDate) => {
          let laborExpenses = 0;
          const laborExpenseBreakdown = {};

          // For each laborer, count their present days in the period
          for (const laborer of laborers) {
            const laborerObjectId = new mongoose.Types.ObjectId(laborer._id);

            // Build query - try both ObjectId and string comparison
            const attendanceQuery = {
              $or: [
                { laborerId: laborerObjectId },
                { laborerId: laborer._id.toString() },
                { laborerId: laborer._id },
              ],
              status: "present",
            };

            if (startDate && endDate) {
              attendanceQuery.date = { $gte: startDate, $lte: endDate };
            } else if (startDate) {
              attendanceQuery.date = startDate;
            }
            const presentDays = await Attendance.countDocuments(
              attendanceQuery
            );
            if (presentDays > 0 && laborer.monthlyPay) {
              const dailyRate = laborer.monthlyPay / 30;
              const laborerExpense = presentDays * dailyRate;

              laborExpenses += laborerExpense;
              laborExpenseBreakdown[laborer.name] = laborerExpense;
            }
          }

          return { laborExpenses, laborExpenseBreakdown };
        };

        // Calculate period-specific labor expenses
        let periodLaborExpenses = 0;
        let periodLaborExpenseBreakdown = {};

        if (period === "daily") {
          const dateStr = targetDate.toISOString().split("T")[0];
          const result = await calculateLaborExpenses(dateStr, null);
          periodLaborExpenses = result.laborExpenses;
          periodLaborExpenseBreakdown = result.laborExpenseBreakdown;
        } else if (period === "monthly") {
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth() + 1;
          const monthStr = String(month).padStart(2, "0");
          const startDate = `${year}-${monthStr}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          const endDate = `${year}-${monthStr}-${String(lastDay).padStart(
            2,
            "0"
          )}`;

          const result = await calculateLaborExpenses(startDate, endDate);
          periodLaborExpenses = result.laborExpenses;
          periodLaborExpenseBreakdown = result.laborExpenseBreakdown;
        } else if (period === "yearly") {
          const year = targetDate.getFullYear();
          const startDate = `${year}-01-01`;
          const endDate = `${year}-12-31`;

          const result = await calculateLaborExpenses(startDate, endDate);
          periodLaborExpenses = result.laborExpenses;
          periodLaborExpenseBreakdown = result.laborExpenseBreakdown;
        } else if (period === "total") {
          const result = await calculateLaborExpenses(null, null);
          periodLaborExpenses = result.laborExpenses;
          periodLaborExpenseBreakdown = result.laborExpenseBreakdown;
        }

        // Existing expense calculation
        const periodExpenses = expenses
          .filter((expense) => dateMatches(expense.date, targetDate, period))
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const totalPeriodExpenses = periodExpenses + periodLaborExpenses;
        const periodRevenue = 0;
        const periodProfit = -totalPeriodExpenses;

        // ===== Calculate daily/monthly/yearly stats BASED ON TARGET DATE =====
        const now = new Date();

        // Daily Stats (Target Date or Today)
        const dailyStatsDate = period === "daily" ? targetDate : new Date();
        const dailyStatsDateStr = dailyStatsDate.toISOString().split("T")[0];

        const dailyExpenses = expenses
          .filter((expense) => {
            const expenseDate = parseDate(expense.date);
            if (!expenseDate) return false;
            return expenseDate.toDateString() === dailyStatsDate.toDateString();
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const dailyLaborResult = await calculateLaborExpenses(
          dailyStatsDateStr,
          null
        );
        const dailyLaborExpenses = dailyLaborResult.laborExpenses;

        const totalDailyExpenses = dailyExpenses + dailyLaborExpenses;
        const dailyRevenue = 0;
        const dailyProfit = -totalDailyExpenses;

        // Monthly Stats (Target Month or Current Month)
        const monthlyStatsDate =
          period === "monthly" || period === "daily" ? targetDate : now;
        const monthlyStatsMonth = monthlyStatsDate.getMonth() + 1;
        const monthlyStatsYear = monthlyStatsDate.getFullYear();
        const monthlyStatsMonthStr = String(monthlyStatsMonth).padStart(2, "0");
        const monthlyStatsStart = `${monthlyStatsYear}-${monthlyStatsMonthStr}-01`;
        const monthlyStatsLastDay = new Date(
          monthlyStatsYear,
          monthlyStatsMonth,
          0
        ).getDate();
        const monthlyStatsEnd = `${monthlyStatsYear}-${monthlyStatsMonthStr}-${String(
          monthlyStatsLastDay
        ).padStart(2, "0")}`;

        const monthlyExpenses = expenses
          .filter((expense) => {
            const expenseDate = parseDate(expense.date);
            if (!expenseDate) return false;
            return (
              expenseDate.getMonth() === monthlyStatsMonth - 1 &&
              expenseDate.getFullYear() === monthlyStatsYear
            );
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const currentMonthLaborResult = await calculateLaborExpenses(
          monthlyStatsStart,
          monthlyStatsEnd
        );
        const currentMonthLaborExpenses = currentMonthLaborResult.laborExpenses;

        const totalMonthlyExpenses =
          monthlyExpenses + currentMonthLaborExpenses;
        const monthlyRevenue = 0;
        const monthlyProfit = -totalMonthlyExpenses;

        // Yearly Stats (Target Year or Current Year)
        const yearlyStatsDate =
          period === "yearly" || period === "monthly" || period === "daily"
            ? targetDate
            : now;
        const yearlyStatsYear = yearlyStatsDate.getFullYear();
        const yearlyStatsStart = `${yearlyStatsYear}-01-01`;
        const yearlyStatsEnd = `${yearlyStatsYear}-12-31`;

        const yearlyExpenses = expenses
          .filter((expense) => {
            const expenseDate = parseDate(expense.date);
            if (!expenseDate) return false;
            return expenseDate.getFullYear() === yearlyStatsYear;
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const currentYearLaborResult = await calculateLaborExpenses(
          yearlyStatsStart,
          yearlyStatsEnd
        );
        const currentYearLaborExpenses = currentYearLaborResult.laborExpenses;

        const totalYearlyExpenses = yearlyExpenses + currentYearLaborExpenses;
        const yearlyRevenue = 0;
        const yearlyProfit = -totalYearlyExpenses;

        // Total All-Time Stats
        const totalExpenses = expenses.reduce(
          (sum, expense) => sum + (expense.amount || 0),
          0
        );

        const allTimeLaborResult = await calculateLaborExpenses(null, null);
        const totalAllTimeLaborExpenses = allTimeLaborResult.laborExpenses;

        const totalOverallExpenses = totalExpenses + totalAllTimeLaborExpenses;
        const totalRevenue = 0;
        const totalProfit = -totalOverallExpenses;

        // Update expense breakdown
        const expenseBreakdown = expenses
          .filter((expense) => dateMatches(expense.date, targetDate, period))
          .reduce((acc, expense) => {
            const type = expense.type || "Other";
            acc[type] = (acc[type] || 0) + (expense.amount || 0);
            return acc;
          }, {});

        if (periodLaborExpenses > 0) {
          expenseBreakdown["Labor"] =
            (expenseBreakdown["Labor"] || 0) + periodLaborExpenses;
        }

        // Monthly trends calculation
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const trendDate = new Date();
          trendDate.setMonth(trendDate.getMonth() - i);
          const trendMonth = trendDate.getMonth() + 1;
          const trendYear = trendDate.getFullYear();
          const monthRevenue = 0;

          const monthExpenses = expenses
            .filter((expense) => {
              const expenseDate = parseDate(expense.date);
              if (!expenseDate) return false;
              return (
                expenseDate.getMonth() === trendMonth - 1 &&
                expenseDate.getFullYear() === trendYear
              );
            })
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);

          const trendMonthStr = String(trendMonth).padStart(2, "0");
          const trendMonthStartStr = `${trendYear}-${trendMonthStr}-01`;
          const trendMonthLastDay = new Date(
            trendYear,
            trendMonth,
            0
          ).getDate();
          const trendMonthEndStr = `${trendYear}-${trendMonthStr}-${String(
            trendMonthLastDay
          ).padStart(2, "0")}`;

          const trendMonthLaborResult = await calculateLaborExpenses(
            trendMonthStartStr,
            trendMonthEndStr
          );
          const trendMonthLaborExpenses = trendMonthLaborResult.laborExpenses;

          monthlyTrends.push({
            month: trendDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            revenue: monthRevenue,
            expenses: monthExpenses + trendMonthLaborExpenses,
            profit: -(monthExpenses + trendMonthLaborExpenses),
          });
        }

        const topExpenseCategories = Object.entries(expenseBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage:
              totalPeriodExpenses > 0
                ? (amount / totalPeriodExpenses) * 100
                : 0,
          }));

        const avgMonthlyRevenue = yearlyRevenue / 12;
        const avgMonthlyExpenses = totalYearlyExpenses / 12;
        const avgMonthlyProfit = yearlyProfit / 12;
        const profitMargin =
          yearlyRevenue > 0 ? (yearlyProfit / yearlyRevenue) * 100 : 0;
        return res.status(200).json({
          periodRevenue,
          periodExpenses: totalPeriodExpenses,
          periodProfit,
          dailyRevenue,
          dailyExpenses: totalDailyExpenses,
          dailyProfit,
          monthlyRevenue,
          monthlyExpenses: totalMonthlyExpenses,
          monthlyProfit,
          yearlyRevenue,
          yearlyExpenses: totalYearlyExpenses,
          yearlyProfit,
          totalRevenue,
          totalExpenses: totalOverallExpenses,
          totalProfit,
          avgMonthlyRevenue,
          avgMonthlyExpenses,
          avgMonthlyProfit,
          profitMargin,
          expenseBreakdown,
          monthlyTrends,
          topExpenseCategories,
          bestMonth:
            monthlyTrends.length > 0
              ? monthlyTrends.reduce((prev, current) =>
                  prev.profit > current.profit ? prev : current
                )
              : null,
          worstMonth:
            monthlyTrends.length > 0
              ? monthlyTrends.reduce((prev, current) =>
                  prev.profit < current.profit ? prev : current
                )
              : null,
          totalTransactions: expenses.length,
          avgTransactionAmount:
            expenses.length > 0 ? totalOverallExpenses / expenses.length : 0,
          targetDate: targetDate.toISOString(),
          period: period || "daily",
          periodLaborExpenses,
          periodLaborExpenseBreakdown,
        });
      }

      const expenses = await Expense.find({}).lean();
      return res.status(200).json(expenses);
    }

    if (req.method === "POST") {
      const expense = await Expense.create(req.body);
      return res.status(201).json(expense);
    }

    if (req.method === "PUT") {
      const { id } = req.query;
      const expense = await Expense.findByIdAndUpdate(id, req.body, {
        new: true,
      });
      return res.status(200).json(expense);
    }

    if (req.method === "DELETE") {
      const { id } = req.query;
      await Expense.findByIdAndDelete(id);
      return res.status(200).json({ message: "Expense deleted successfully" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Expenses API Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
}
