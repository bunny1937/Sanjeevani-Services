import { useState, useEffect } from 'react'
import styles from './Dashboard.module.css'

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    netProfit: 0,
    totalProperties: 0,
    upcomingReminders: 0,
    waterTankCleaning: 0,
    pestControl: 0,
    activeLabor: 'TBD',
    totalRevenue: 0,
    monthlyExpenses: 0
  })

  useEffect(() => {
    // Fetch dashboard stats
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard-stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const StatCard = ({ title, value, subtitle, color = 'blue', icon = '₹' }) => (
    <div className={styles.statCard}>
      <div className={styles.statCardContent}>
        <div className={styles.statInfo}>
          <p>{title}</p>
          <p className={`${styles.statValue} ${styles[color]}`}>
            {typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
          </p>
          <p className={styles.statDescription}>{subtitle}</p>
        </div>
        <div className={`${styles.statIcon} ${styles[color]}`}>
          <span>{icon}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1>Dashboard</h1>
        <p>Welcome to Sanjeevani Services - Your business overview</p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyRevenue}
          subtitle="Revenue for current month"
          color="blue"
          icon="💰"
        />
        <StatCard
          title="Net Profit"
          value={stats.netProfit}
          subtitle="Monthly revenue minus expenses"
          color="green"
          icon="📈"
        />
        <StatCard
          title="Total Properties"
          value={stats.totalProperties}
          subtitle="Properties in database"
          color="blue"
          icon="🏠"
        />
        <StatCard
          title="Upcoming Reminders"
          value={stats.upcomingReminders}
          subtitle="Properties due for service"
          color="orange"
          icon="⏰"
        />
      </div>

      {/* Service Stats */}
      <div className={styles.serviceStatsGrid}>
        <StatCard
          title="Water Tank Cleaning"
          value={stats.waterTankCleaning}
          subtitle="Monthly revenue from water tank services"
          color="blue"
          icon="🚿"
        />
        <StatCard
          title="Pest Control"
          value={stats.pestControl}
          subtitle="Monthly revenue from pest control"
          color="green"
          icon="🐛"
        />
        <StatCard
          title="Active Labor"
          value={stats.activeLabor}
          subtitle="To be defined"
          color="purple"
          icon="👷"
        />
      </div>

      {/* Financial Overview */}
      <div className={styles.financialGrid}>
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          subtitle="All time revenue from services"
          color="green"
          icon="💰"
        />
        <StatCard
          title="Monthly Expenses"
          value={stats.monthlyExpenses}
          subtitle="Expenses for current month"
          color="red"
          icon="📊"
        />
      </div>
    </div>
  )
}

export default Dashboard