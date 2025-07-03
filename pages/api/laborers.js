
import connectDB from '../../lib/mongodb'
import Laborer from '../../models/Laborer'

export default async function handler(req, res) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const laborers = await Laborer.find({}).sort({ createdAt: -1 })
      res.status(200).json(laborers)
    } else if (req.method === 'POST') {
      const laborer = new Laborer(req.body)
      await laborer.save()
      res.status(201).json(laborer)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling laborers', error: error.message })
  }
}
