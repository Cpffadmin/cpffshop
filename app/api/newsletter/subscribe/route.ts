import { NextResponse } from "next/server";
import Newsletter from "@/utils/models/Newsletter";
import { connectToDatabase } from "@/utils/database";
import { validateEmail } from "@/utils/validation";

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    // Validate email
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if email already exists
    const existingSubscriber = await Newsletter.findByEmail(email);

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { error: "Email is already subscribed" },
          { status: 400 }
        );
      } else {
        // Reactivate subscription
        await existingSubscriber.resubscribe();
        return NextResponse.json(
          { message: "Subscription reactivated successfully" },
          { status: 200 }
        );
      }
    }

    // Create new subscriber
    const subscriber = new Newsletter({
      email,
      source: source || "website",
      preferences: {
        marketing: true,
        updates: true,
        promotions: true,
      },
    });

    await subscriber.save();

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}
