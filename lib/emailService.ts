import sgMail from "@sendgrid/mail";

// Make sure API key is set before any email operations
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is not configured");
}

// Set API key with explicit type casting to string
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  try {
    // Validate sender email
    if (!process.env.SENDER_EMAIL) {
      throw new Error("SENDER_EMAIL is not configured");
    }

    // Log attempt without exposing sensitive data
    console.log(`Attempting to send email to ${to} with subject: ${subject}`);
    console.log("SendGrid Configuration:", {
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      senderEmail: process.env.SENDER_EMAIL,
      apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 5),
    });

    const msg = {
      to,
      from: process.env.SENDER_EMAIL,
      subject,
      text,
      html,
    };

    const result = await sgMail.send(msg);
    console.log("SendGrid Response:", result[0].statusCode);

    // Log success
    console.log(`Email sent successfully to ${to}`);
    return { success: true };
  } catch (error) {
    // Enhanced error logging
    console.error("SendGrid error details:", {
      error,
      to,
      subject,
      timestamp: new Date().toISOString(),
    });

    // Return structured error response
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
};
