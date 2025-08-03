"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./Expenses.module.css";

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [stats, setStats] = useState({
    periodRevenue: 0, // Added for clarity, though calculated
    periodExpenses: 0,
    periodProfit: 0,
    monthlyRevenue: 0, // Added for clarity
    monthlyExpenses: 0,
    monthlyProfit: 0,
    yearlyRevenue: 0, // Added for clarity
    yearlyExpenses: 0,
    yearlyProfit: 0,
    dailyRevenue: 0, // Added for clarity
    dailyExpenses: 0,
    dailyProfit: 0,
    totalRevenue: 0, // Added for clarity
    totalExpenses: 0,
    totalProfit: 0,
    avgMonthlyRevenue: 0, // Added for clarity
    avgMonthlyExpenses: 0, // Added for clarity
    avgMonthlyProfit: 0, // Added for clarity
    profitMargin: 0,
    expenseBreakdown: {},
    monthlyTrends: [],
    topExpenseCategories: [],
    periodLaborExpenses: 0, // New: Total labor expenses for the period
    periodLaborExpenseBreakdown: {}, // New: Detailed labor expenses for the period
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("monthly"); // Changed default to monthly for better labor expense visibility
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLaborDetailModal, setShowLaborDetailModal] = useState(false); // New state for labor detail modal
  const [formData, setFormData] = useState({
    date: "",
    type: "",
    amount: "",
    description: "",
  });

  const expenseTypes = ["Transportation", "Miscellaneous", "Labor"];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/expenses");
      if (response.ok) {
        const data = await response.json();
        setExpenses(data);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const dateParam = formatDateForAPI(currentDate);
      const response = await fetch(
        `/api/expenses?stats=true&date=${dateParam}&period=${selectedPeriod}`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, selectedPeriod]);
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const filterExpenses = useCallback(() => {
    let filtered = [...expenses];

    if (selectedPeriod === "daily") {
      const targetDate = formatDateForAPI(currentDate);
      filtered = filtered.filter((expense) => {
        if (!expense.date) return false;
        const expenseDate = formatDateForAPI(new Date(expense.date));
        return expenseDate === targetDate;
      });
    } else if (selectedPeriod === "monthly") {
      const targetMonth = currentDate.getMonth();
      const targetYear = currentDate.getFullYear();
      filtered = filtered.filter((expense) => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === targetMonth &&
          expenseDate.getFullYear() === targetYear
        );
      });
    } else if (selectedPeriod === "yearly") {
      const targetYear = currentDate.getFullYear();
      filtered = filtered.filter((expense) => {
        if (!expense.date) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === targetYear;
      });
    }

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (expense) =>
          (expense.description &&
            expense.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (expense.type &&
            expense.type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType) {
      filtered = filtered.filter((expense) => expense.type === selectedType);
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredExpenses(filtered);
  }, [expenses, searchTerm, selectedType, currentDate, selectedPeriod]);
  useEffect(() => {
    filterExpenses();
  }, [filterExpenses]);

  const formatDateForAPI = (date) => {
    return date.toISOString().split("T")[0];
  };

  const handleAddExpense = () => {
    setShowAddForm(true);
    setFormData({
      date: formatDateForAPI(new Date()),
      type: "",
      amount: "",
      description: "",
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      });
      if (response.ok) {
        setShowAddForm(false);
        await fetchExpenses();
        await fetchStats();
        setFormData({
          date: "",
          type: "",
          amount: "",
          description: "",
        });
      }
    } catch (error) {
      console.error("Error adding expense:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);

    if (selectedPeriod === "daily") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (selectedPeriod === "monthly") {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (selectedPeriod === "yearly") {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }

    setCurrentDate(newDate);
  };

  const handleDateSelect = (date) => {
    setCurrentDate(new Date(date));
    setShowCalendar(false);
  };

  const formatDateDisplay = () => {
    const options = {
      daily: {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
      monthly: { year: "numeric", month: "long" },
      yearly: { year: "numeric" },
      total: { year: "numeric", month: "long", day: "numeric" },
    };

    if (selectedPeriod === "total") {
      return "All Time";
    }

    return currentDate.toLocaleDateString("en-US", options[selectedPeriod]);
  };

  const getStatsForPeriod = () => {
    // The API now returns combined expenses, so we just use periodExpenses
    return {
      expenses: stats.periodExpenses,
      profit: stats.periodProfit,
      laborExpenses: stats.periodLaborExpenses, // New: Labor expenses for the period
      period:
        selectedPeriod === "daily"
          ? "Today"
          : selectedPeriod === "monthly"
          ? "This Month"
          : selectedPeriod === "yearly"
          ? "This Year"
          : "All Time",
    };
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("");
  };

  const currentStats = getStatsForPeriod();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Expense Management</h1>
          <p>Track daily expenses and monitor profitability</p>
        </div>
        <div className={styles.headerControls}>
          <select
            value={selectedPeriod}
            onChange={(e) => {
              setSelectedPeriod(e.target.value);
              setCurrentDate(new Date()); // Reset to current date when changing period
            }}
            className={styles.periodSelector}
          >
            <option value="daily">Daily View</option>
            <option value="monthly">Monthly View</option>
            <option value="yearly">Yearly View</option>
            <option value="total">All Time</option>
          </select>
          <button
            onClick={handleAddExpense}
            className={styles.primaryBtn}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Add Expense"}
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      {selectedPeriod !== "total" && (
        <div className={styles.dateNavigation}>
          <button
            onClick={() => navigateDate(-1)}
            className={styles.navBtn}
            disabled={isLoading}
          >
            ←
          </button>
          <div className={styles.dateDisplay}>
            <span
              onClick={() => setShowCalendar(true)}
              className={styles.dateText}
            >
              {formatDateDisplay()}
            </span>
            <button
              onClick={() => setShowCalendar(true)}
              className={styles.calendarBtn}
              disabled={isLoading}
            >
              📅
            </button>
          </div>
          <button
            onClick={() => navigateDate(1)}
            className={styles.navBtn}
            disabled={isLoading}
          >
            →
          </button>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Select Date</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowCalendar(false)}
              >
                ×
              </button>
            </div>
            <input
              type="date"
              value={formatDateForAPI(currentDate)}
              onChange={(e) => handleDateSelect(e.target.value)}
              className={styles.dateInput}
            />
            <div className={styles.formButtons}>
              <button
                onClick={() => setShowCalendar(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Financial Overview */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.expenseCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{formatCurrency(currentStats.expenses)}</h3>
              <p className={styles.statTitle}>Total Expenses</p>
              <p className={styles.statDescription}>{formatDateDisplay()}</p>
            </div>
            <div className={styles.statIcon}>📊</div>
          </div>
        </div>
        {/* New Labor Expenses Card */}
        {(selectedPeriod === "monthly" ||
          selectedPeriod === "yearly" ||
          selectedPeriod === "total") && (
          <div
            className={`${styles.statCard} ${styles.laborExpenseCard}`}
            onClick={() => setShowLaborDetailModal(true)}
          >
            <div className={styles.statContent}>
              <div className={styles.statInfo}>
                <h3>{formatCurrency(currentStats.laborExpenses)}</h3>
                <p className={styles.statTitle}>Labor Expenses</p>
                <p className={styles.statDescription}>
                  {selectedPeriod === "monthly"
                    ? "This Month"
                    : selectedPeriod === "yearly"
                    ? "This Year"
                    : "All Time"}{" "}
                  (Click for details)
                </p>
              </div>
              <div className={styles.statIcon}>👷</div>
            </div>
          </div>
        )}
        <div
          className={`${styles.statCard} ${
            currentStats.profit >= 0 ? styles.profitCard : styles.lossCard
          }`}
        >
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{formatCurrency(currentStats.profit)}</h3>
              <p className={styles.statTitle}>
                {currentStats.profit >= 0 ? "Profit" : "Loss"}
              </p>
              <p className={styles.statDescription}>{formatDateDisplay()}</p>
            </div>
            <div className={styles.statIcon}>
              {currentStats.profit >= 0 ? "📈" : "📉"}
            </div>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.marginCard}`}>
          <div className={styles.statContent}>
            <div className={styles.statInfo}>
              <h3>{(stats.profitMargin ?? 0).toFixed(1)}%</h3>
              <p className={styles.statTitle}>Profit Margin</p>
              <p className={styles.statDescription}>Annual Performance</p>
            </div>
            <div className={styles.statIcon}>🎯</div>
          </div>
        </div>
      </div>

      {/* Labor Detail Modal */}
      {showLaborDetailModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Labor Expenses Detail - {formatDateDisplay()}</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowLaborDetailModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles.laborDetailList}>
              {Object.keys(stats.periodLaborExpenseBreakdown).length === 0 ? (
                <p className={styles.noData}>
                  No labor expenses for this period.
                </p>
              ) : (
                Object.entries(stats.periodLaborExpenseBreakdown).map(
                  ([name, amount]) => (
                    <div key={name} className={styles.laborDetailItem}>
                      <span>{name}:</span>
                      <span>{formatCurrency(amount)}</span>
                    </div>
                  )
                )
              )}
              <div className={styles.laborDetailTotal}>
                <span>Total Labor Expenses:</span>
                <span>{formatCurrency(stats.periodLaborExpenses)}</span>
              </div>
            </div>
            <div className={styles.formButtons}>
              <button
                onClick={() => setShowLaborDetailModal(false)}
                className={styles.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Financial Breakdown */}
      <div className={styles.detailedStats}>
        <div className={styles.detailSection}>
          <h3>Financial Overview</h3>
          <div className={styles.detailGrid}>
            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <h4>Daily Summary</h4>
                <span className={styles.detailIcon}>📅</span>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailRow}>
                  <span>Expenses:</span>
                  <span className={styles.negative}>
                    {formatCurrency(stats.dailyExpenses)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span>Net Profit:</span>
                  <span
                    className={
                      stats.dailyProfit >= 0 ? styles.positive : styles.negative
                    }
                  >
                    {formatCurrency(stats.dailyProfit)}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <h4>Monthly Summary</h4>
                <span className={styles.detailIcon}>📊</span>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailRow}>
                  <span>Expenses:</span>
                  <span className={styles.negative}>
                    {formatCurrency(stats.monthlyExpenses)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span>Net Profit:</span>
                  <span
                    className={
                      stats.monthlyProfit >= 0
                        ? styles.positive
                        : styles.negative
                    }
                  >
                    {formatCurrency(stats.monthlyProfit)}
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.detailCard}>
              <div className={styles.detailHeader}>
                <h4>Yearly Summary</h4>
                <span className={styles.detailIcon}>📆</span>
              </div>
              <div className={styles.detailContent}>
                <div className={styles.detailRow}>
                  <span>Expenses:</span>
                  <span className={styles.negative}>
                    {formatCurrency(stats.yearlyExpenses)}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span>Net Profit:</span>
                  <span
                    className={
                      stats.yearlyProfit >= 0
                        ? styles.positive
                        : styles.negative
                    }
                  >
                    {formatCurrency(stats.yearlyProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Category Breakdown */}
      <div className={styles.categoryBreakdown}>
        <h3>Expense Categories</h3>
        <div className={styles.categoryGrid}>
          {Object.entries(stats.expenseBreakdown || {}).length === 0 ? (
            <p className={styles.noData}>
              No expense categories for this period.
            </p>
          ) : (
            Object.entries(stats.expenseBreakdown).map(([category, amount]) => (
              <div key={category} className={styles.categoryCard}>
                <div className={styles.categoryHeader}>
                  <h4>{category}</h4>
                  <span className={styles.categoryAmount}>
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className={styles.categoryProgress}>
                  <div
                    className={styles.progressBar}
                    style={{
                      width: `${
                        currentStats.expenses > 0
                          ? (amount / currentStats.expenses) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <p className={styles.categoryPercent}>
                  {currentStats.expenses > 0
                    ? ((amount / currentStats.expenses) * 100).toFixed(1)
                    : 0}
                  % of total expenses
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Form */}
      {showAddForm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Add New Expense</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setShowAddForm(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Type:</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Type</option>
                  {expenseTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Amount:</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter description"
                  required
                />
              </div>
              <div className={styles.formButtons}>
                <button type="submit" className={styles.submitBtn}>
                  Add Expense
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter Container */}
      <div className={styles.filterContainer}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">All Types</option>
            {expenseTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {(searchTerm || selectedType) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("");
              }}
              className={styles.clearFiltersBtn}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Expense Records Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <h3>Expense Records</h3>
          <span className={styles.recordCount}>
            {filteredExpenses.length} records
            {searchTerm || selectedType
              ? ` (filtered from ${expenses.length})`
              : ""}
          </span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className={styles.noData}>
                    {searchTerm || selectedType
                      ? "No expenses found matching your filters."
                      : "No expenses recorded yet. Add your first expense to get started."}
                  </td>
                </tr>
              ) : (
                filteredExpenses
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((expense) => (
                    <tr key={expense._id}>
                      <td>{new Date(expense.date).toLocaleDateString()}</td>
                      <td>
                        <span className={styles.expenseType}>
                          {expense.type}
                        </span>
                      </td>
                      <td className={styles.amount}>
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className={styles.description}>
                        {expense.description}
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button className={styles.actionBtn} title="Edit">
                            ✏️
                          </button>
                          <button className={styles.actionBtn} title="Delete">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Expenses;
