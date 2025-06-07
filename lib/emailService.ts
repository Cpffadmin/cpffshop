import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

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
    await sgMail.send({
      to,
      from: process.env.SENDER_EMAIL!,
      subject,
      text,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("SendGrid error:", error);
    return { success: false, error };
  }
};
