import dotenv from "dotenv";
import axios from "axios";
import { connectToDatabase } from "../utils/database";

dotenv.config({ path: ".env.local" });

const BASE_URL = "http://localhost:3000/api";

async function testAuth() {
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

    // 2. Test Login
    console.log("\nTesting login...");
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    console.log("Login response:", loginResponse.data);

    console.log("\nAll tests completed successfully!");
  } catch (error: any) {
    console.error("Test failed:", error.message);
    if (error.response) {
      console.error("Error response:", error.response.data);
    }
    process.exit(1);
  }
}

testAuth();
