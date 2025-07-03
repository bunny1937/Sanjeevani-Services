
import connectDB from '../../lib/mongodb'
import Service from '../../models/Service'

export default async function handler(req, res) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const services = await Service.find({ active: true }).sort({ createdAt: -1 })
      res.status(200).json(services)
    } else if (req.method === 'POST') {
      const service = new Service(req.body)
      await service.save()
      res.status(201).json(service)
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Error handling services', error: error.message })
  }
}
