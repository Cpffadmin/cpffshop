import dotenv from "dotenv";
import axios from "axios";
import { connectToDatabase } from "../utils/database";
import { logger } from "../utils/logger";

dotenv.config();

const BASE_URL = "http://localhost:3000/api";

async function testApp() {
  try {
    // Connect to database
    await connectToDatabase();
    logger.info("Connected to database");

    // Test data
    const testUser = {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: "Test123!",
    };

    // 1. Test Registration
    logger.info("Testing registration...");
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    logger.info("Registration successful:", registerResponse.data);

    // 2. Test Login
    logger.info("Testing login...");
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
    });
    logger.info("Login successful:", loginResponse.data);

    // Get auth token
    const token = loginResponse.data.token;
    const authHeader = { Authorization: `Bearer ${token}` };

    // 3. Test User Data Access
    logger.info("Testing user data access...");
    const userDataResponse = await axios.get(`${BASE_URL}/userData`, {
      headers: authHeader,
    });
    logger.info("User data retrieved:", userDataResponse.data);

    // 4. Test Products API
    logger.info("Testing products API...");

    // Get all products
    const productsResponse = await axios.get(
      `${BASE_URL}/products/allProducts`
    );
    logger.info("Products retrieved:", productsResponse.data);

    // Create a test product (admin only)
    if (userDataResponse.data.user.admin) {
      logger.info("Testing product creation (admin)...");
      const testProduct = {
        name: `Test Product ${Date.now()}`,
        description: "Test Description",
        price: 99.99,
        category: "Electronics",
        brand: "Test Brand",
        stock: 10,
        images: ["test-image.jpg"],
      };

      const createProductResponse = await axios.post(
        `${BASE_URL}/products/manage`,
        testProduct,
        { headers: authHeader }
      );
      logger.info("Product created:", createProductResponse.data);

      // Test product update
      const productId = createProductResponse.data.product._id;
      logger.info("Testing product update...");
      const updateProductResponse = await axios.patch(
        `${BASE_URL}/products/manage/${productId}`,
        { price: 89.99 },
        { headers: authHeader }
      );
      logger.info("Product updated:", updateProductResponse.data);

      // Test product deletion
      logger.info("Testing product deletion...");
      const deleteProductResponse = await axios.delete(
        `${BASE_URL}/products/manage/${productId}`,
        { headers: authHeader }
      );
      logger.info("Product deleted:", deleteProductResponse.data);
    }

    // 5. Test Reviews API
    logger.info("Testing reviews API...");
    const reviewsResponse = await axios.get(`${BASE_URL}/review/allReviews`);
    logger.info("Reviews retrieved:", reviewsResponse.data);

    // 6. Test Admin Routes (if admin)
    if (userDataResponse.data.user.admin) {
      logger.info("Testing admin routes...");

      // Get all users
      const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
        headers: authHeader,
      });
      logger.info("Users retrieved:", usersResponse.data);

      // Get admin dashboard data
      const dashboardResponse = await axios.get(`${BASE_URL}/admin/dashboard`, {
        headers: authHeader,
      });
      logger.info("Dashboard data retrieved:", dashboardResponse.data);
    }

    // 7. Test Error Handling
    logger.info("Testing error handling...");

    // Test invalid product ID
    try {
      await axios.get(`${BASE_URL}/products/manage/invalid-id`, {
        headers: authHeader,
      });
    } catch (error: any) {
      logger.info(
        "Invalid product ID test passed:",
        error.response?.status === 400
      );
    }

    // Test unauthorized access
    try {
      await axios.get(`${BASE_URL}/admin/users`);
    } catch (error: any) {
      logger.info(
        "Unauthorized access test passed:",
        error.response?.status === 401
      );
    }

    logger.info("All tests completed successfully!");
  } catch (error: any) {
    logger.error("Test failed:", error.message);
    if (error.response) {
      logger.error("Error response:", error.response.data);
    }
    process.exit(1);
  }
}

testApp();
