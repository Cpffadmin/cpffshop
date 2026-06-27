import { NextResponse } from "next/server";
import Newsletter from "@/utils/models/Newsletter";
import StoreSettings from "@/utils/models/StoreSettings";
import { connectToDatabase } from "@/utils/database";
import { validateEmail } from "@/utils/validation";
import { sendEmail } from "@/lib/emailService";
import { buildSubscribeConfirmationEmail } from "@/lib/buildNewsletterConfirmationEmail";

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

    const storeSettings = await StoreSettings.findOne();
    const confirmationEmailContent =
      storeSettings?.newsletterSettings?.confirmationEmail;

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
        const mail = buildSubscribeConfirmationEmail(
          email,
          confirmationEmailContent
        );
        const emailResult = await sendEmail({ to: email, ...mail });
        if (emailResult.delivered) {
          await Newsletter.findByIdAndUpdate(existingSubscriber._id, {
            lastEmailSentAt: new Date(),
          });
        } else {
          console.error(
            "Newsletter re-subscribe confirmation email failed:",
            emailResult.error
          );
        }
        return NextResponse.json(
          {
            message: "Subscription reactivated successfully",
            emailSent: emailResult.delivered,
          },
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
    const mail = buildSubscribeConfirmationEmail(
      email,
      confirmationEmailContent
    );
    const emailResult = await sendEmail({ to: email, ...mail });
    if (emailResult.delivered) {
      await Newsletter.findByIdAndUpdate(subscriber._id, {
        lastEmailSentAt: new Date(),
      });
    } else {
      console.error(
        "Newsletter subscribe confirmation email failed:",
        emailResult.error
      );
    }

    return NextResponse.json(
      { message: "Subscribed successfully", emailSent: emailResult.delivered },
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
