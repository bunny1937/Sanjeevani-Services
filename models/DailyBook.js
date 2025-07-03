
import mongoose from 'mongoose'

const DailyBookSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  property: {
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
  service: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  remarks: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
})

export default mongoose.models.DailyBook || mongoose.model('DailyBook', DailyBookSchema)
