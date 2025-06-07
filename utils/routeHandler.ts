import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "./database";
import { logger } from "./logger";
import mongoose from "mongoose";

interface RouteHandlerOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  maxRetries?: number;
}

export async function withDatabaseConnection<T>(
  handler: () => Promise<T>,
  options: RouteHandlerOptions = {}
): Promise<NextResponse> {
  const { requireAuth = false, requireAdmin = false, maxRetries = 3 } = options;
  let retries = maxRetries;

  while (retries > 0) {
    try {
      await connectToDatabase();
      const isConnected = await waitForConnection();

      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      const result = await handler();
      return NextResponse.json(result);
    } catch (error) {
      logger.error(`Operation failed (retries left: ${retries - 1})`, error);

      if (retries <= 1) {
        // Handle specific error types
        if (error instanceof mongoose.Error.ValidationError) {
          return NextResponse.json(
            { error: "Validation error", details: error.errors },
            { status: 400 }
          );
        }

        if (error instanceof mongoose.Error.CastError) {
          return NextResponse.json(
            { error: "Invalid ID format", details: error.message },
            { status: 400 }
          );
        }

        // Check for duplicate key error
        if (
          error instanceof Error &&
          error.name === "MongoServerError" &&
          (error as any).code === 11000
        ) {
          return NextResponse.json(
            { error: "Duplicate entry", details: error.message },
            { status: 409 }
          );
        }

        if (error instanceof mongoose.Error) {
          return NextResponse.json(
            { error: "Database error", details: error.message },
            { status: 500 }
          );
        }

        // Handle authentication errors
        if (error instanceof Error) {
          if (error.message === "Unauthorized") {
            return NextResponse.json(
              { error: "Unauthorized access" },
              { status: 401 }
            );
          }
          if (error.message === "User not authenticated") {
            return NextResponse.json(
              { error: "Authentication required" },
              { status: 401 }
            );
          }
          if (error.message === "User not found") {
            return NextResponse.json(
              { error: "User not found" },
              { status: 404 }
            );
          }
          if (error.message === "Product not found") {
            return NextResponse.json(
              { error: "Product not found" },
              { status: 404 }
            );
          }
          if (error.message === "Invalid product id") {
            return NextResponse.json(
              { error: "Invalid product ID format" },
              { status: 400 }
            );
          }
          if (error.message === "Missing required fields") {
            return NextResponse.json(
              { error: "Missing required fields" },
              { status: 400 }
            );
          }
          if (error.message === "User already exists") {
            return NextResponse.json(
              { error: "User already exists" },
              { status: 409 }
            );
          }
        }

        // Handle unknown errors
        return NextResponse.json(
          {
            error: "Operation failed",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          { status: 500 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}

export function createRouteHandler(options: RouteHandlerOptions = {}) {
  return async function routeHandler<T>(
    handler: () => Promise<T>
  ): Promise<NextResponse> {
    return withDatabaseConnection(handler, options);
  };
}
