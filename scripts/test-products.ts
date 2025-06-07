require("dotenv").config({ path: ".env.local" });

const axios = require("axios");
const { connectToDatabase } = require("../utils/database");

const BASE_URL = "http://localhost:3000/api";

async function testProducts() {
  console.log("Starting product tests...\n");

  try {
    await connectToDatabase();
    console.log("Database connected successfully\n");

    // Test 1: Get all products
    console.log("Testing Get All Products...");
    const productsResponse = await axios.get(
      `${BASE_URL}/products/allProducts`
    );
    console.log(
      "Products retrieved successfully:",
      productsResponse.data.length,
      "products found"
    );

    // Test 2: Invalid product ID
    console.log("\nTesting Invalid Product ID...");
    try {
      await axios.get(`${BASE_URL}/products/manage/invalid-id`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log("Invalid ID test passed");
      } else {
        throw error;
      }
    }

    console.log("\nAll product tests completed successfully!");
  } catch (error: any) {
    console.error("Test failed:", error.response?.data || error.message);
    process.exit(1);
  }
}

testProducts();
