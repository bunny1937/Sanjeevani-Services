
import connectDB from '../../lib/mongodb'
import Expense from '../../models/Expense'

export default async function handler(req, res) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const expenses = await Expense.find({}).sort({ createdAt: -1 })
      res.status(200).json(expenses)
    } else if (req.method === 'POST') {
      const expense = new Expense(req.body)
      await expense.save()
      res.status(201).json(expense)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling expenses', error: error.message })
  }
}
