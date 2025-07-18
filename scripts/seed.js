// seed.js - MongoDB Attendance Data Seeder
import mongoose from "mongoose";

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/your-database",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Schemas
const AttendanceSchema = new mongoose.Schema(
  {
    laborerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laborer",
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent"],
      required: true,
    },
  },
  { timestamps: true }
);

const LaborerSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    joiningDate: String,
    daysWorked: Number,
    monthlyPay: Number,
    lastAttendance: String,
    status: String,
  },
  { timestamps: true }
);

const Attendance =
  mongoose.models.Attendance ||
  mongoose.model("Attendance", AttendanceSchema, "attendance");
const Laborer =
  mongoose.models.Laborer ||
  mongoose.model("Laborer", LaborerSchema, "laborers");

// Your existing laborers data
const laborers = [
  {
    _id: new mongoose.Types.ObjectId("6866cc8dbcdae0d3d585b433"),
    name: "Abhishek Dhanpawde",
    phone: "9876543220",
    joiningDate: "2023-06-01",
    daysWorked: 22,
    monthlyPay: 15000,
    lastAttendance: "2025-01-15",
    status: "Active",
  },
  {
    _id: new mongoose.Types.ObjectId("6866cc8dbcdae0d3d585b434"),
    name: "Suresh Yadav",
    phone: "9876543221",
    joiningDate: "2023-08-15",
    daysWorked: 20,
    monthlyPay: 14000,
    lastAttendance: "2024-01-14",
    status: "Active",
  },
  {
    _id: new mongoose.Types.ObjectId("6866cc8dbcdae0d3d585b435"),
    name: "Mahesh Singh",
    phone: "9876543222",
    joiningDate: "2023-10-01",
    daysWorked: 18,
    monthlyPay: 13000,
    lastAttendance: "2024-01-12",
    status: "Active",
  },
];

// Utility function to generate date range
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// Generate realistic attendance patterns
const generateAttendanceForLaborer = (
  laborerId,
  startDate,
  endDate,
  attendanceRate = 0.85
) => {
  const dates = generateDateRange(startDate, endDate);
  const attendanceRecords = [];

  dates.forEach((date) => {
    const dayOfWeek = new Date(date).getDay();

    // Skip Sundays (0) for most workers
    if (dayOfWeek === 0) {
      return;
    }

    // Higher chance of absence on Mondays and Saturdays
    let dailyAttendanceRate = attendanceRate;
    if (dayOfWeek === 1) dailyAttendanceRate *= 0.9; // Monday
    if (dayOfWeek === 6) dailyAttendanceRate *= 0.8; // Saturday

    // Random absence patterns
    const isPresent = Math.random() < dailyAttendanceRate;

    attendanceRecords.push({
      laborerId: laborerId,
      date: date,
      status: isPresent ? "present" : "absent",
    });
  });

  return attendanceRecords;
};

// Generate attendance for different periods
const generateAttendanceData = () => {
  const allAttendanceRecords = [];

  // Generate attendance for the last 6 months
  const currentDate = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(currentDate.getMonth() - 6);

  laborers.forEach((laborer) => {
    // Different attendance rates for different workers
    let attendanceRate = 0.85;

    if (laborer.name === "Abhishek Dhanpawde") attendanceRate = 0.92; // Most regular
    if (laborer.name === "Suresh Yadav") attendanceRate = 0.88;
    if (laborer.name === "Mahesh Singh") attendanceRate = 0.8; // Least regular

    const laborerAttendance = generateAttendanceForLaborer(
      laborer._id,
      sixMonthsAgo.toISOString().split("T")[0],
      currentDate.toISOString().split("T")[0],
      attendanceRate
    );

    allAttendanceRecords.push(...laborerAttendance);
  });

  return allAttendanceRecords;
};

// Update laborer statistics based on attendance
const updateLaborerStats = async () => {
  console.log("Updating laborer statistics...");

  for (const laborer of laborers) {
    const attendanceRecords = await Attendance.find({
      laborerId: laborer._id,
      status: "present",
    });

    const totalDaysWorked = attendanceRecords.length;

    // Find the most recent attendance
    const allAttendance = await Attendance.find({
      laborerId: laborer._id,
    }).sort({ date: -1 });

    const lastAttendanceRecord = allAttendance[0];

    // Update laborer record
    await Laborer.findByIdAndUpdate(laborer._id, {
      daysWorked: totalDaysWorked,
      lastAttendance: lastAttendanceRecord
        ? lastAttendanceRecord.date
        : laborer.lastAttendance,
    });

    console.log(`Updated ${laborer.name}: ${totalDaysWorked} days worked`);
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    await connectDB();

    console.log("Starting database seeding...");

    // Clear existing data
    console.log("Clearing existing attendance data...");
    await Attendance.deleteMany({});

    // Ensure laborers exist
    console.log("Ensuring laborers exist...");
    for (const laborer of laborers) {
      await Laborer.findOneAndUpdate({ _id: laborer._id }, laborer, {
        upsert: true,
        new: true,
      });
    }

    // Generate and insert attendance data
    console.log("Generating attendance data...");
    const attendanceData = generateAttendanceData();

    console.log(`Generated ${attendanceData.length} attendance records`);

    // Insert attendance records in batches
    const batchSize = 100;
    for (let i = 0; i < attendanceData.length; i += batchSize) {
      const batch = attendanceData.slice(i, i + batchSize);
      await Attendance.insertMany(batch);
      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          attendanceData.length / batchSize
        )}`
      );
    }

    // Update laborer statistics
    await updateLaborerStats();

    console.log("Database seeding completed successfully!");

    // Display summary
    const totalRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({
      status: "present",
    });
    const absentRecords = await Attendance.countDocuments({ status: "absent" });

    console.log("\n=== SEEDING SUMMARY ===");
    console.log(`Total attendance records: ${totalRecords}`);
    console.log(`Present records: ${presentRecords}`);
    console.log(`Absent records: ${absentRecords}`);
    console.log(
      `Overall attendance rate: ${(
        (presentRecords / totalRecords) *
        100
      ).toFixed(2)}%`
    );

    // Display per laborer summary
    console.log("\n=== PER LABORER SUMMARY ===");
    for (const laborer of laborers) {
      const laborerTotal = await Attendance.countDocuments({
        laborerId: laborer._id,
      });
      const laborerPresent = await Attendance.countDocuments({
        laborerId: laborer._id,
        status: "present",
      });
      const rate =
        laborerTotal > 0
          ? ((laborerPresent / laborerTotal) * 100).toFixed(2)
          : 0;

      console.log(
        `${laborer.name}: ${laborerPresent}/${laborerTotal} (${rate}%)`
      );
    }
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Add some specific test data for current month
const addCurrentMonthData = async () => {
  console.log("Adding current month test data...");

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of current month
  const firstDay = new Date(currentYear, currentMonth, 1);
  const today = new Date();

  const currentMonthDates = generateDateRange(
    firstDay.toISOString().split("T")[0],
    today.toISOString().split("T")[0]
  );

  // Add more recent attendance for testing
  const recentAttendance = [];

  laborers.forEach((laborer) => {
    currentMonthDates.forEach((date) => {
      const dayOfWeek = new Date(date).getDay();
      if (dayOfWeek === 0) return; // Skip Sundays

      // Higher attendance rate for current month
      const isPresent = Math.random() < 0.9;

      recentAttendance.push({
        laborerId: laborer._id,
        date: date,
        status: isPresent ? "present" : "absent",
      });
    });
  });

  // Insert current month data (will update existing records)
  for (const record of recentAttendance) {
    await Attendance.findOneAndUpdate(
      { laborerId: record.laborerId, date: record.date },
      record,
      { upsert: true, new: true }
    );
  }

  console.log(`Added ${recentAttendance.length} current month records`);
};

// Run the seeder
const runSeeder = async () => {
  await seedDatabase();
  await connectDB();
  await addCurrentMonthData();
  await updateLaborerStats();
  await mongoose.connection.close();
};

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeder();
}

export default runSeeder;
