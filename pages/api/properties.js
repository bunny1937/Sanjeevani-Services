
import connectDB from '../../lib/mongodb'
import Property from '../../models/Property'

export default async function handler(req, res) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const properties = await Property.find({}).sort({ createdAt: -1 })
      res.status(200).json(properties)
    } else if (req.method === 'POST') {
      const property = new Property(req.body)
      await property.save()
      res.status(201).json(property)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling properties', error: error.message })
  }
}
