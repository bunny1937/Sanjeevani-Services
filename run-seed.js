// run-seed.js - Simple runner for the seed script
import dotenv from "dotenv";
import runSeeder from "./scripts/seed.js";

// Load environment variables
dotenv.config();

console.log("🌱 Starting attendance data seeding...");
console.log(
  "Database:",
  process.env.MONGODB_URI || "mongodb://localhost:27017/your-database"
);

runSeeder()
  .then(() => {
    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
