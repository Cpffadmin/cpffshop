import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import StoreSettings from "@/utils/models/StoreSettings";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

// Older documents stored some bilingual fields as a plain string. Mongoose
// rejects the whole save when it meets one, so widen them to { en, zh-TW }.
function coerceBilingualStrings(
  value: unknown,
  schema: mongoose.Schema,
  path: string
): unknown {
  const schemaPath = path ? schema.path(path) : null;

  if (schemaPath && "schema" in schemaPath && schemaPath.schema) {
    const subSchema = schemaPath.schema as mongoose.Schema;
    return Array.isArray(value)
      ? value.map((item) => coerceBilingualStrings(item, subSchema, ""))
      : value;
  }

  if (typeof value === "string") {
    return path && schema.path(`${path}.en`)
      ? { en: value, "zh-TW": value }
      : value;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      coerceBilingualStrings(entry, schema, path ? `${path}.${key}` : key),
    ])
  );
}

export async function GET() {
  let retries = 3;

  while (retries > 0) {
    try {
      await connectToDatabase();

      // Wait for connection to be ready with timeout
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      // Get store settings from database
      let settings = await StoreSettings.findOne();

      // If no settings exist, create default settings
      if (!settings) {
        settings = await StoreSettings.create({
          contactInfo: {
            email: "contact@example.com",
            phone: "+1234567890",
          },
        });
      }

      return NextResponse.json(settings);
    } catch (error) {
      console.error(
        `Failed to fetch store settings (retries left: ${retries - 1}):`,
        error
      );

      if (retries <= 1) {
        return NextResponse.json(
          { error: "Failed to fetch store settings" },
          { status: 500 }
        );
      }

      // Wait longer between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read the request body EXACTLY ONCE, before the retry loop. A Request body
  // is a single-use stream, so reading it inside the loop would throw
  // "Body has already been read" on the first retry and mask the real error.
  let body: { settings?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { settings } = body;
  if (!settings) {
    return NextResponse.json({ error: "No settings provided" }, { status: 400 });
  }

  let retries = 3;

  while (retries > 0) {
    try {
      await connectToDatabase();
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      const payload = coerceBilingualStrings(
        { ...(settings as Record<string, unknown>) },
        StoreSettings.schema,
        ""
      ) as Record<string, unknown>;
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.id;

      let doc = await StoreSettings.findOne();
      if (!doc) {
        doc = new StoreSettings(payload);
      } else {
        doc.set(payload);
      }
      if (payload.navIntros) doc.markModified("navIntros");
      if (payload.productPageIntro) doc.markModified("productPageIntro");
      await doc.save();

      if (payload.navIntros || payload.productPageIntro) {
        await StoreSettings.collection.updateOne(
          { _id: doc._id },
          {
            $set: {
              ...(payload.navIntros
                ? { navIntros: payload.navIntros }
                : {}),
              ...(payload.productPageIntro
                ? { productPageIntro: payload.productPageIntro }
                : {}),
            },
          }
        );
        doc = await StoreSettings.findById(doc._id);
      }

      return NextResponse.json(doc.toObject());
    } catch (error) {
      console.error(
        `Failed to save store settings (retries left: ${retries - 1}):`,
        error
      );

      if (retries <= 1) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        return NextResponse.json(
          { error: "Failed to save store settings", details: errorMessage },
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
