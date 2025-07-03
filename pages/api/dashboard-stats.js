
import connectDB from '../../lib/mongodb'
import Property from '../../models/Property'
import DailyBook from '../../models/DailyBook'
import Expense from '../../models/Expense'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    await connectDB()

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7)

    // Calculate stats (using dummy data for now)
    const stats = {
      monthlyRevenue: 25000,
      netProfit: 18000,
      totalProperties: 15,
      upcomingReminders: 8,
      waterTankCleaning: 12000,
      pestControl: 8000,
      activeLabor: 'TBD',
      totalRevenue: 150000,
      monthlyExpenses: 7000
    }

    res.status(200).json(stats)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message })
  }
}
