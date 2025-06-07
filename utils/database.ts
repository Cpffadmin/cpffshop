import mongoose from "mongoose";
import { logger } from "./logger";
import { ensureModelsAreRegistered } from "./models";

const MONGODB_URI = process.env.MONGODB_URI!;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const CONNECTION_TIMEOUT = 10000;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let isConnecting = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

async function connectToDatabase() {
  try {
    if (mongoose.connection.readyState === 1) {
      // Ensure models are registered even if already connected
      ensureModelsAreRegistered();
      return mongoose;
    }

    if (isConnecting && connectionPromise) {
      await connectionPromise;
      ensureModelsAreRegistered();
      return mongoose;
    }

    isConnecting = true;

    const options = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: CONNECTION_TIMEOUT,
    };

    logger.info("Connecting to MongoDB...", { uri: MONGODB_URI, options });

    connectionPromise = mongoose.connect(MONGODB_URI, options);
    await connectionPromise;

    // Ensure models are registered after successful connection
    ensureModelsAreRegistered();

    logger.info("MongoDB connected successfully");
    return mongoose;
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    throw error;
  } finally {
    isConnecting = false;
    connectionPromise = null;
  }
}

async function waitForConnection(
  timeout: number = CONNECTION_TIMEOUT
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (mongoose.connection.readyState === 1) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return false;
}

async function disconnectFromDatabase() {
  try {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
  } catch (error) {
    logger.error("Error disconnecting from MongoDB:", error);
    throw error;
  }
}

// Export both named and default exports
export { connectToDatabase, waitForConnection, disconnectFromDatabase };
export default connectToDatabase;
