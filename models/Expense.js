
import mongoose from 'mongoose'

const ExpenseSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ['Transportation', 'Materials', 'Labor', 'Other'],
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
})

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema)
