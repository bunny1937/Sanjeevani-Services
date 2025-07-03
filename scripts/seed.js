
const mongoose = require('mongoose')

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sanjeevani-services'

// Models
const PropertySchema = new mongoose.Schema({
  name: String,
  keyPerson: String,
  contact: String,
  location: String,
  serviceType: String,
  amount: Number,
  lastService: String,
}, { timestamps: true })

const ServiceSchema = new mongoose.Schema({
  name: String,
  description: String,
  defaultPrice: Number,
  active: Boolean,
}, { timestamps: true })

const DailyBookSchema = new mongoose.Schema({
  date: String,
  property: String,
  keyPerson: String,
  contact: String,
  location: String,
  service: String,
  amount: Number,
  remarks: String,
}, { timestamps: true })

const ExpenseSchema = new mongoose.Schema({
  date: String,
  type: String,
  amount: Number,
  description: String,
}, { timestamps: true })

const LaborerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  joiningDate: String,
  daysWorked: Number,
  monthlyPay: Number,
  lastAttendance: String,
  status: String,
}, { timestamps: true })

const Property = mongoose.models.Property || mongoose.model('Property', PropertySchema)
const Service = mongoose.models.Service || mongoose.model('Service', ServiceSchema)
const DailyBook = mongoose.models.DailyBook || mongoose.model('DailyBook', DailyBookSchema)
const Expense = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema)
const Laborer = mongoose.models.Laborer || mongoose.model('Laborer', LaborerSchema)

// Dummy data
const dummyProperties = [
  {
    name: 'Sunrise Apartments',
    keyPerson: 'Rajesh Kumar',
    contact: '9876543210',
    location: 'Sector 15, Gurgaon',
    serviceType: 'Water Tank Cleaning',
    amount: 2500,
    lastService: '2024-01-15'
  },
  {
    name: 'Green Valley Society',
    keyPerson: 'Priya Sharma',
    contact: '9876543211',
    location: 'Sector 22, Gurgaon',
    serviceType: 'Pest Control',
    amount: 1800,
    lastService: '2024-01-10'
  },
  {
    name: 'Royal Heights',
    keyPerson: 'Amit Singh',
    contact: '9876543212',
    location: 'Sector 8, Gurgaon',
    serviceType: 'Motor Repairing',
    amount: 3200,
    lastService: '2024-01-05'
  }
]

const dummyServices = [
  {
    name: 'Pest Control',
    description: 'Default service for Pest Control',
    defaultPrice: 1500,
    active: true
  },
  {
    name: 'Water Tank Cleaning',
    description: 'Default service for Water Tank Cleaning',
    defaultPrice: 2000,
    active: true
  },
  {
    name: 'Motor Repairing & Rewinding',
    description: 'Default service for Motor Repairing',
    defaultPrice: 3000,
    active: true
  }
]

const dummyDailyBook = [
  {
    date: '2024-01-15',
    property: 'Sunrise Apartments',
    keyPerson: 'Rajesh Kumar',
    contact: '9876543210',
    location: 'Sector 15, Gurgaon',
    service: 'Water Tank Cleaning',
    amount: 2500,
    remarks: 'Regular maintenance'
  },
  {
    date: '2024-01-10',
    property: 'Green Valley Society',
    keyPerson: 'Priya Sharma',
    contact: '9876543211',
    location: 'Sector 22, Gurgaon',
    service: 'Pest Control',
    amount: 1800,
    remarks: 'Quarterly service'
  }
]

const dummyExpenses = [
  {
    date: '2024-01-15',
    type: 'Transportation',
    amount: 500,
    description: 'Fuel for service vehicle'
  },
  {
    date: '2024-01-10',
    type: 'Materials',
    amount: 800,
    description: 'Cleaning chemicals and equipment'
  },
  {
    date: '2024-01-05',
    type: 'Labor',
    amount: 1200,
    description: 'Daily wages for workers'
  }
]

const dummyLaborers = [
  {
    name: 'Ravi Kumar',
    phone: '9876543220',
    joiningDate: '2023-06-01',
    daysWorked: 22,
    monthlyPay: 15000,
    lastAttendance: '2024-01-15',
    status: 'Active'
  },
  {
    name: 'Suresh Yadav',
    phone: '9876543221',
    joiningDate: '2023-08-15',
    daysWorked: 20,
    monthlyPay: 14000,
    lastAttendance: '2024-01-14',
    status: 'Active'
  },
  {
    name: 'Mahesh Singh',
    phone: '9876543222',
    joiningDate: '2023-10-01',
    daysWorked: 18,
    monthlyPay: 13000,
    lastAttendance: '2024-01-12',
    status: 'Active'
  }
]

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    await Property.deleteMany({})
    await Service.deleteMany({})
    await DailyBook.deleteMany({})
    await Expense.deleteMany({})
    await Laborer.deleteMany({})

    // Insert dummy data
    await Property.insertMany(dummyProperties)
    await Service.insertMany(dummyServices)
    await DailyBook.insertMany(dummyDailyBook)
    await Expense.insertMany(dummyExpenses)
    await Laborer.insertMany(dummyLaborers)

    console.log('Database seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding database:', error)
    process.exit(1)
  }
}

seedDatabase()
