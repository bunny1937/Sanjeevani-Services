
import connectDB from '../../lib/mongodb'
import DailyBook from '../../models/DailyBook'

export default async function handler(req, res) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const entries = await DailyBook.find({}).sort({ createdAt: -1 })
      res.status(200).json(entries)
    } else if (req.method === 'POST') {
      const entry = new DailyBook(req.body)
      await entry.save()
      res.status(201).json(entry)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling daily book', error: error.message })
  }
}
