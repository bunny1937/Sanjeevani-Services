import dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import { writeFileSync } from "fs";

async function exportAllCollections() {
  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI;

  if (!uri) {
    console.error("❌ No MongoDB URI found in environment variables.");
    return;
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("test");

    const collections = [
      "attendance",
      // "dailybooks",
      // "expenses",
      "laborers",
      // "properties",
      // "services",
      // "reminders",
    ];

    const allData = {};

    for (const name of collections) {
      const documents = await db.collection(name).find({}).toArray();
      allData[name] = documents;
    }

    writeFileSync(
      "test_database_export.json",
      JSON.stringify(allData, null, 2)
    );
    console.log("✅ All collections exported to test_database_export.json");
  } catch (error) {
    console.error("❌ Error exporting collections:", error);
  } finally {
    await client.close();
  }
}

exportAllCollections();
