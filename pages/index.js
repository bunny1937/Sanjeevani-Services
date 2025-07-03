
import { useState, useEffect } from 'react'

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

  const StatCard = ({ title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600`}>₹{value}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className={`w-8 h-8 bg-${color}-100 rounded-full flex items-center justify-center`}>
          <span className="text-xs">₹</span>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Sanjeevani Services - Your business overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Monthly Revenue"
          value={stats.monthlyRevenue}
          subtitle="Revenue for current month"
          color="blue"
        />
        <StatCard
          title="Net Profit"
          value={stats.netProfit}
          subtitle="Monthly revenue minus expenses"
          color="green"
        />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalProperties}</p>
              <p className="text-xs text-gray-500">Properties in database</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🏠</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Reminders</p>
              <p className="text-2xl font-bold text-orange-600">{stats.upcomingReminders}</p>
              <p className="text-xs text-gray-500">Properties due for service</p>
            </div>
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-xs">⏰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Water Tank Cleaning</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.waterTankCleaning}</p>
              <p className="text-xs text-gray-500">Monthly revenue from water tank services</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🚿</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pest Control</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.pestControl}</p>
              <p className="text-xs text-gray-500">Monthly revenue from pest control</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs">🐛</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Labor</p>
              <p className="text-2xl font-bold text-purple-600">{stats.activeLabor}</p>
              <p className="text-xs text-gray-500">To be defined</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-xs">👷</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue}</p>
              <p className="text-xs text-gray-500">All time revenue from services</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xs">💰</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
              <p className="text-2xl font-bold text-red-600">₹{stats.monthlyExpenses}</p>
              <p className="text-xs text-gray-500">Expenses for current month</p>
            </div>
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xs">📊</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
