
import mongoose from 'mongoose'

const LaborerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  joiningDate: {
    type: String,
    required: true,
  },
  daysWorked: {
    type: Number,
    default: 0,
  },
  monthlyPay: {
    type: Number,
    required: true,
  },
  lastAttendance: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
}, {
  timestamps: true,
})

export default mongoose.models.Laborer || mongoose.model('Laborer', LaborerSchema)
