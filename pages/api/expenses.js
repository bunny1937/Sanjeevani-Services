// pages/api/expenses.js
import connectDB from "../../lib/mongodb.js";
import mongoose from "mongoose";

// Expense Schema
const ExpenseSchema = new mongoose.Schema(
  {
    date: String,
    type: String,
    amount: Number,
    description: String,
  },
  { timestamps: true }
);

// DailyBook Schema for revenue calculation
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

const Expense =
  mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema, "expenses");

const DailyBook =
  mongoose.models.DailyBook ||
  mongoose.model("DailyBook", DailyBookSchema, "dailybooks");

export default async function handler(req, res) {
  try {
    await connectDB();

    if (req.method === "GET") {
      // If requesting financial stats
      if (req.query.stats === "true") {
        const { date, period } = req.query;

        const expenses = await Expense.find({}).lean();
        const dailyBooks = await DailyBook.find({}).lean();

        // Parse the target date from query or use current date
        const targetDate = date ? new Date(date) : new Date();

        // Helper function to parse date strings consistently
        const parseDate = (dateStr) => {
          if (!dateStr) return null;

          let date;
          try {
            // Handle YYYY-MM-DD format (ISO format)
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              date = new Date(dateStr + "T00:00:00.000Z");
            }
            // Handle DD/MM/YYYY format
            else if (dateStr.includes("/") && dateStr.split("/").length === 3) {
              const parts = dateStr.split("/");
              if (parts[0].length === 4) {
                // YYYY/MM/DD
                date = new Date(parts[0], parts[1] - 1, parts[2]);
              } else if (parts[2].length === 4) {
                // DD/MM/YYYY or MM/DD/YYYY
                date = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
            // Handle other formats
            else {
              date = new Date(dateStr);
            }

            return isNaN(date.getTime()) ? null : date;
          } catch (error) {
            console.error("Date parsing error:", dateStr, error);
            return null;
          }
        };

        // Helper function to check if dates match based on period
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
              return true; // for 'total' period
          }
        };

        // Calculate expenses based on period
        const periodExpenses = expenses
          .filter((expense) => dateMatches(expense.date, targetDate, period))
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        // Calculate revenue based on period
        const periodRevenue = dailyBooks
          .filter((entry) => dateMatches(entry.date, targetDate, period))
          .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        // Calculate profit
        const periodProfit = periodRevenue - periodExpenses;

        // Calculate current month data (for consistency)
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyExpenses = expenses
          .filter((expense) => {
            const expenseDate = parseDate(expense.date);
            if (!expenseDate) return false;
            return (
              expenseDate.getMonth() === currentMonth &&
              expenseDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const monthlyRevenue = dailyBooks
          .filter((entry) => {
            const entryDate = parseDate(entry.date);
            if (!entryDate) return false;
            return (
              entryDate.getMonth() === currentMonth &&
              entryDate.getFullYear() === currentYear
            );
          })
          .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        // Calculate yearly data
        const yearlyExpenses = expenses
          .filter((expense) => {
            const expenseDate = parseDate(expense.date);
            if (!expenseDate) return false;
            return expenseDate.getFullYear() === currentYear;
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const yearlyRevenue = dailyBooks
          .filter((entry) => {
            const entryDate = parseDate(entry.date);
            if (!entryDate) return false;
            return entryDate.getFullYear() === currentYear;
          })
          .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        // Calculate total data
        const totalExpenses = expenses.reduce(
          (sum, expense) => sum + (expense.amount || 0),
          0
        );

        const totalRevenue = dailyBooks.reduce(
          (sum, entry) => sum + (entry.amount || 0),
          0
        );

        // Calculate daily data for today
        const today = new Date();
        const dailyExpenses = expenses
          .filter((expense) => {
            const expenseDate = parseDate(expense.date);
            if (!expenseDate) return false;
            return expenseDate.toDateString() === today.toDateString();
          })
          .reduce((sum, expense) => sum + (expense.amount || 0), 0);

        const dailyRevenue = dailyBooks
          .filter((entry) => {
            const entryDate = parseDate(entry.date);
            if (!entryDate) return false;
            return entryDate.toDateString() === today.toDateString();
          })
          .reduce((sum, entry) => sum + (entry.amount || 0), 0);

        // Calculate profits
        const monthlyProfit = monthlyRevenue - monthlyExpenses;
        const yearlyProfit = yearlyRevenue - yearlyExpenses;
        const totalProfit = totalRevenue - totalExpenses;
        const dailyProfit = dailyRevenue - dailyExpenses;

        // Calculate expense breakdown by category for the current period
        const expenseBreakdown = expenses
          .filter((expense) => dateMatches(expense.date, targetDate, period))
          .reduce((acc, expense) => {
            const type = expense.type || "Other";
            acc[type] = (acc[type] || 0) + (expense.amount || 0);
            return acc;
          }, {});

        // Calculate monthly trends (last 12 months)
        const monthlyTrends = [];
        for (let i = 11; i >= 0; i--) {
          const trendDate = new Date();
          trendDate.setMonth(trendDate.getMonth() - i);
          const trendMonth = trendDate.getMonth();
          const trendYear = trendDate.getFullYear();

          const monthRevenue = dailyBooks
            .filter((entry) => {
              const entryDate = parseDate(entry.date);
              if (!entryDate) return false;
              return (
                entryDate.getMonth() === trendMonth &&
                entryDate.getFullYear() === trendYear
              );
            })
            .reduce((sum, entry) => sum + (entry.amount || 0), 0);

          const monthExpenses = expenses
            .filter((expense) => {
              const expenseDate = parseDate(expense.date);
              if (!expenseDate) return false;
              return (
                expenseDate.getMonth() === trendMonth &&
                expenseDate.getFullYear() === trendYear
              );
            })
            .reduce((sum, expense) => sum + (expense.amount || 0), 0);

          monthlyTrends.push({
            month: trendDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            revenue: monthRevenue,
            expenses: monthExpenses,
            profit: monthRevenue - monthExpenses,
          });
        }

        // Calculate top expense categories
        const topExpenseCategories = Object.entries(expenseBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([category, amount]) => ({
            category,
            amount,
            percentage:
              periodExpenses > 0 ? (amount / periodExpenses) * 100 : 0,
          }));

        // Calculate additional metrics
        const avgMonthlyRevenue = yearlyRevenue / 12;
        const avgMonthlyExpenses = yearlyExpenses / 12;
        const avgMonthlyProfit = yearlyProfit / 12;
        const profitMargin =
          yearlyRevenue > 0 ? (yearlyProfit / yearlyRevenue) * 100 : 0;

        // Debug logging
        console.log("=== EXPENSE STATS DEBUG ===");
        console.log("Target Date:", targetDate.toDateString());
        console.log("Period:", period);
        console.log("Period Revenue:", periodRevenue);
        console.log("Period Expenses:", periodExpenses);
        console.log("Period Profit:", periodProfit);
        console.log("Daily Revenue:", dailyRevenue);
        console.log("Daily Expenses:", dailyExpenses);
        console.log("Daily Profit:", dailyProfit);
        console.log("Monthly Revenue:", monthlyRevenue);
        console.log("Monthly Expenses:", monthlyExpenses);
        console.log("Monthly Profit:", monthlyProfit);
        console.log("Yearly Revenue:", yearlyRevenue);
        console.log("Yearly Expenses:", yearlyExpenses);
        console.log("Yearly Profit:", yearlyProfit);
        console.log("Total Revenue:", totalRevenue);
        console.log("Total Expenses:", totalExpenses);
        console.log("Total Profit:", totalProfit);
        console.log("Expense Breakdown:", expenseBreakdown);
        console.log("=== END DEBUG ===");

        return res.status(200).json({
          // Period-specific data (changes based on selected date and period)
          periodRevenue,
          periodExpenses,
          periodProfit,

          // Standard time period data
          dailyRevenue,
          dailyExpenses,
          dailyProfit,
          monthlyRevenue,
          monthlyExpenses,
          monthlyProfit,
          yearlyRevenue,
          yearlyExpenses,
          yearlyProfit,
          totalRevenue,
          totalExpenses,
          totalProfit,

          // Calculated metrics
          avgMonthlyRevenue,
          avgMonthlyExpenses,
          avgMonthlyProfit,
          profitMargin,
          expenseBreakdown,
          monthlyTrends,
          topExpenseCategories,

          // Additional insights
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
          totalTransactions: expenses.length + dailyBooks.length,
          avgTransactionAmount:
            expenses.length + dailyBooks.length > 0
              ? (totalRevenue + totalExpenses) /
                (expenses.length + dailyBooks.length)
              : 0,

          // Debug info
          targetDate: targetDate.toISOString(),
          period: period || "daily",
        });
      }

      // Return all expenses (with optional filtering)
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
