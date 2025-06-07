import { connectToDatabase } from "../utils/database";
import Product from "../utils/models/Product";
import Brand from "../utils/models/Brand";
import Category from "../utils/models/Category";
import mongoose from "mongoose";

async function seedProducts() {
  try {
    await connectToDatabase();
    console.log("Connected to database");

    // Get or create a test brand
    let brand = await Brand.findOne({ name: "Test Brand" });
    if (!brand) {
      brand = await Brand.create({
        name: "Test Brand",
        displayNames: {
          en: "Test Brand",
          "zh-TW": "測試品牌",
        },
      });
    }

    // Get or create a test category
    let category = await Category.findOne({ name: "Test Category" });
    if (!category) {
      category = await Category.create({
        name: "Test Category",
        displayNames: {
          en: "Test Category",
          "zh-TW": "測試分類",
        },
        slug: "test-category",
      });
    }

    // Create 20 test products
    const products = [];
    for (let i = 1; i <= 20; i++) {
      products.push({
        name: `Test Product ${i}`,
        displayNames: {
          en: `Test Product ${i}`,
          "zh-TW": `測試產品 ${i}`,
        },
        description: `Description for test product ${i}`,
        descriptions: {
          en: `Description for test product ${i}`,
          "zh-TW": `測試產品 ${i} 的描述`,
        },
        price: Math.floor(Math.random() * 100) + 1,
        originalPrice: Math.floor(Math.random() * 150) + 100,
        stock: Math.floor(Math.random() * 50),
        images: ["/product-placeholder.jpg"],
        brand: brand._id,
        category: category._id,
        user: new mongoose.Types.ObjectId(), // This should be a valid admin user ID
        specifications: [],
      });
    }

    await Product.insertMany(products);
    console.log("Successfully seeded products");
  } catch (error) {
    console.error("Error seeding products:", error);
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
