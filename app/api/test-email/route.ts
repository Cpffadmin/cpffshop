import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";

export async function POST(request: Request) {
  try {
    // Log environment variables (without exposing sensitive data)
    console.log("Environment check:", {
      hasSendgridKey: !!process.env.SENDGRID_API_KEY,
      hasSenderEmail: !!process.env.SENDER_EMAIL,
      senderEmail: process.env.SENDER_EMAIL,
    });

    const { email = "test@example.com" } = await request.json();
    console.log("Attempting to send test email to:", email);

    const result = await sendEmail({
      to: email,
      subject: "Test Email from EcommApp",
      text: "This is a test email from your ecommerce app",
      html: "<h1>Test Email</h1><p>This is a test email from your ecommerce app</p>",
    });

    console.log("Email send result:", {
      success: result.success,
      error: result.error,
      timestamp: result.timestamp,
    });

    if (result.success) {
      return NextResponse.json({ message: "Email sent successfully" });
    } else {
      return NextResponse.json(
        {
          error: "Failed to send email",
          details: result.error,
          timestamp: result.timestamp,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        error: "Server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
