// components/DashboardClient.jsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import styles from "./Dashboard.module.css";

const DashboardClient = () => {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    netProfit: 0,
    totalProperties: 0,
    upcomingReminders: 0,
    waterTankCleaning: 0,
    pestControl: 0,
    motorRepairing: 0,
    activeLabor: 0,
    totalRevenue: 0,
    monthlyExpenses: 0,
  });

  const [chartData, setChartData] = useState({
    months: [],
    revenues: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        propertiesRes,
        servicesRes,
        dailyBookRes,
        expensesRes,
        laborersRes,
        remindersRes,
      ] = await Promise.all([
        fetch("/api/properties"),
        fetch("/api/services"),
        fetch("/api/daily-book"),
        fetch("/api/expenses"),
        fetch("/api/laborers"),
        fetch("/api/reminders"),
      ]);

      // Check if any requests failed
      const responses = [
        { name: "Properties", res: propertiesRes },
        { name: "Services", res: servicesRes },
        { name: "Daily Book", res: dailyBookRes },
        { name: "Expenses", res: expensesRes },
        { name: "Laborers", res: laborersRes },
        { name: "Reminders", res: remindersRes },
      ];

      for (const { name, res } of responses) {
        if (!res.ok) {
          console.warn(`${name} API failed: ${res.status}`);
        }
      }

      // Parse responses with fallbacks
      const propertiesData = propertiesRes.ok
        ? await propertiesRes.json()
        : { properties: [] };
      const servicesData = servicesRes.ok
        ? await servicesRes.json()
        : { services: [] };
      const dailyBookData = dailyBookRes.ok
        ? await dailyBookRes.json()
        : { entries: [] };
      const expensesData = expensesRes.ok
        ? await expensesRes.json()
        : { expenses: [] };
      const laborersData = laborersRes.ok
        ? await laborersRes.json()
        : { laborers: [] };
      const remindersData = remindersRes.ok
        ? await remindersRes.json()
        : { reminders: [] };

      const properties = Array.isArray(propertiesData)
        ? propertiesData
        : propertiesData.properties || [];

      const services = Array.isArray(servicesData)
        ? servicesData
        : servicesData.services || [];

      const dailyBook = Array.isArray(dailyBookData)
        ? dailyBookData
        : dailyBookData.entries || [];

      const expenses = Array.isArray(expensesData)
        ? expensesData
        : expensesData.expenses || [];

      const laborers = Array.isArray(laborersData)
        ? laborersData
        : laborersData.laborers || [];

      const reminders = remindersData;

      const calculatedStats = calculateStats(
        properties,
        services,
        dailyBook,
        expenses,
        laborers,
        reminders
      );

      const monthlyChartData = getMonthlyData(dailyBook);

      setStats(calculatedStats);
      setChartData(monthlyChartData);
    } catch (error) {
      console.error("=== ERROR IN FETCH ===", error);
      setError(`Failed to load dashboard data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [fetchAllData, user]);

  const calculateStats = (
    properties,
    services,
    dailyBook,
    expenses,
    laborers,
    reminders
  ) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filter current month data
    const currentMonthDailyBook = dailyBook.filter((entry) => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth &&
        entryDate.getFullYear() === currentYear
      );
    });

    const currentMonthExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });

    // Calculate monthly revenue
    const monthlyRevenue = currentMonthDailyBook.reduce(
      (sum, entry) => sum + (entry.amount || 0),
      0
    );

    // Calculate monthly expenses
    const monthlyExpenses = currentMonthExpenses.reduce(
      (sum, expense) => sum + (expense.amount || 0),
      0
    );

    // Calculate net profit
    const netProfit = monthlyRevenue - monthlyExpenses;

    // Calculate total revenue (all time)
    const totalRevenue = dailyBook.reduce(
      (sum, entry) => sum + (entry.amount || 0),
      0
    );

    // Combine all reminder arrays from the API response
    const allReminders = [
      ...(reminders?.reminders || []),
      ...(reminders?.upcomingReminders || []),
      ...(reminders?.scheduledReminders || []),
      ...(reminders?.completedReminders || []),
    ];

    const waterTankCleaningAmount = dailyBook.reduce((sum, entry) => {
      if (
        entry.service &&
        entry.service.toLowerCase().includes("water tank cleaning")
      ) {
        return sum + (entry.amount || 0);
      }
      return sum;
    }, 0);
    const waterTankCleaning = `₹${waterTankCleaningAmount.toLocaleString(
      "en-IN"
    )}`;

    const pestControlAmount = dailyBook.reduce((sum, entry) => {
      if (
        entry.service &&
        entry.service.toLowerCase().includes("pest control")
      ) {
        return sum + (entry.amount || 0);
      }
      return sum;
    }, 0);
    const pestControl = `₹${pestControlAmount.toLocaleString("en-IN")}`;

    const motorRepairingAmount = dailyBook.reduce((sum, entry) => {
      if (entry.service && entry.service.toLowerCase().includes("motor")) {
        return sum + (entry.amount || 0);
      }
      return sum;
    }, 0);
    const motorRepairing = `₹${motorRepairingAmount.toLocaleString("en-IN")}`;

    // Calculate active laborers
    const activeLabor = laborers.filter(
      (laborer) => laborer.status === "Active"
    ).length;

    const upcomingReminders = reminders?.stats?.totalReminders || 0;

    return {
      monthlyRevenue,
      netProfit,
      totalProperties: properties.length,
      upcomingReminders,
      waterTankCleaning,
      pestControl,
      motorRepairing,
      activeLabor,
      totalRevenue,
      monthlyExpenses,
    };
  };

  const getMonthlyData = (dailyBook) => {
    const months = [];
    const revenues = [];
    const currentDate = new Date();

    // Get last 6 months of data
    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1
      );
      const monthName = date.toLocaleString("default", { month: "short" });
      months.push(monthName);

      // Calculate revenue for this month
      const monthRevenue = dailyBook
        .filter((entry) => {
          const entryDate = new Date(entry.date);
          return (
            entryDate.getMonth() === date.getMonth() &&
            entryDate.getFullYear() === date.getFullYear()
          );
        })
        .reduce((sum, entry) => sum + (entry.amount || 0), 0);

      revenues.push(monthRevenue);
    }

    return { months, revenues };
  };

  const StatCard = ({ title, value, subtitle, gradient, icon, onClick }) => (
    <div
      className={`${styles.statCard} ${styles[gradient]} ${
        onClick ? styles.clickable : ""
      }`}
      onClick={onClick}
    >
      <div className={styles.statCardContent}>
        <div className={styles.statHeader}>
          <div className={styles.statIcon}>
            <span>{icon}</span>
          </div>
        </div>
        <div className={styles.statInfo}>
          <h3 className={styles.statValue}>
            {(typeof value === "number" && title.includes("Revenue")) ||
            title.includes("Profit") ||
            title.includes("Expenses")
              ? `₹${value.toLocaleString()}`
              : value}
          </h3>
          <p className={styles.statTitle}>{title}</p>
          <p className={styles.statDescription}>{subtitle}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <div className={styles.spinnerRing}></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Error loading dashboard</h3>
          <p>{error}</p>
          <button onClick={fetchAllData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Dashboard</h1>
      </div>

      {/* Main Stats Grid */}
      <div className={styles.mainStatsGrid}>
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyRevenue}
          subtitle="Revenue for current month"
          gradient="darkGrayCard"
          icon="💰"
        />
        <StatCard
          title="Net Profit"
          value={stats.netProfit}
          subtitle="Monthly revenue minus expenses"
          gradient="grayCard"
          icon="📈"
        />
        <StatCard
          title="Total Properties"
          value={stats.totalProperties}
          subtitle="Properties in database"
          gradient="lightGrayCard"
          icon="🏠"
        />
        <StatCard
          title="Upcoming Reminders"
          value={stats.upcomingReminders}
          subtitle="Properties due for service"
          gradient="mediumGrayCard"
          icon="⏰"
          onClick={() => router.push("/reminders")}
        />
      </div>

      {/* Service Stats */}
      <div className={styles.serviceStatsGrid}>
        <StatCard
          title="Water Tank Cleaning"
          value={stats.waterTankCleaning}
          subtitle="Monthly revenue from water tank services"
          gradient="lightGrayCard"
          icon="🚿"
        />
        <StatCard
          title="Pest Control"
          value={stats.pestControl}
          subtitle="Monthly revenue from pest control"
          gradient="grayCard"
          icon="🐛"
        />
        <StatCard
          title="Motor Repairing"
          value={stats.motorRepairing}
          subtitle="Monthly revenue from motor services"
          gradient="mediumGrayCard"
          icon="⚙️"
        />
        <StatCard
          title="Active Labor"
          value={stats.activeLabor}
          subtitle="Currently active laborers"
          gradient="darkGrayCard"
          icon="👷"
        />
      </div>

      {/* Financial Overview */}
      <div className={styles.financialGrid}>
        <div className={styles.financialCard}>
          <div className={styles.financialHeader}>
            <h3>Financial Overview</h3>
            <p>Current month summary</p>
          </div>
          <div className={styles.financialStats}>
            <div className={styles.financialStat}>
              <span className={styles.financialLabel}>Total Revenue</span>
              <span className={styles.financialValue}>
                ₹{stats.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className={styles.financialStat}>
              <span className={styles.financialLabel}>Monthly Expenses</span>
              <span className={styles.financialValue}>
                ₹{stats.monthlyExpenses.toLocaleString()}
              </span>
            </div>
            <div className={styles.financialStat}>
              <span className={styles.financialLabel}>Profit Margin</span>
              <span className={styles.financialValue}>
                {stats.monthlyRevenue > 0
                  ? ((stats.netProfit / stats.monthlyRevenue) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardClient;
