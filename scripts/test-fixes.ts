import axios from "axios";
import { connectToDatabase } from "../utils/database";
import fs from "fs";
import path from "path";

// Read and set environment variables directly
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = envContent.split("\n").reduce((acc, line) => {
    const [key, value] = line.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {} as Record<string, string>);

  // Set environment variables
  Object.entries(envVars).forEach(([key, value]) => {
    process.env[key] = value;
  });
}

// Debug environment variables
console.log(
  "Using MongoDB URI:",
  process.env.MONGODB_URI ? "exists" : "missing"
);

const BASE_URL = "http://localhost:3000/api";

async function testFixes() {
  try {
    // Connect to database first
    await connectToDatabase();
    console.log("Connected to database");

    // 1. Test Registration
    console.log("\nTesting registration...");
    const testUser = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "Test123!",
    };

    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log("Registration response:", registerResponse.data);

    // 2. Test Invalid Product ID
    console.log("\nTesting invalid product ID...");
    try {
      await axios.get(`${BASE_URL}/products/manage/invalid-id`);
    } catch (error: any) {
      console.log(
        "Invalid product ID test passed:",
        error.response?.status === 400
      );
      console.log("Error message:", error.response?.data?.error);
    }

    console.log("\nAll tests completed successfully!");
  } catch (error: any) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    process.exit(1);
  }
}

testFixes();
