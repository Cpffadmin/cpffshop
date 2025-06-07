import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/emailService";

export async function POST(request: Request) {
  try {
    const { email = "test@example.com" } = await request.json();

    const result = await sendEmail({
      to: email,
      subject: "Test Email from EcommApp",
      text: "This is a test email from your ecommerce app",
      html: "<h1>Test Email</h1><p>This is a test email from your ecommerce app</p>",
    });

    if (result.success) {
      return NextResponse.json({ message: "Email sent successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
