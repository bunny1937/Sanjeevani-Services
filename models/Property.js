
import mongoose from 'mongoose'

const PropertySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  keyPerson: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  lastService: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.Property || mongoose.model('Property', PropertySchema)
