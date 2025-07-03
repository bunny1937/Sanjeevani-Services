
import connectDB from '../../lib/mongodb'

export default async function handler(req, res) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const { type } = req.query
      
      // Return empty array for now - will be populated based on report type
      res.status(200).json([])
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling reports', error: error.message })
  }
}
