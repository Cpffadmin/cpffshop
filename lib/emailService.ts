import * as Brevo from "@getbrevo/brevo";

type EmailAttachment = {
  name: string;
  content: string; // base64-encoded file content
};

type SendEmailArgs = {
  to: string;
  subject: string;
  text: string;
  html: string;
  senderEmail?: string;
  senderName?: string;
  attachments?: EmailAttachment[];
};

let brevoClient: Brevo.TransactionalEmailsApi | null = null;

function getBrevoClient(): Brevo.TransactionalEmailsApi | null {
  try {
    if (brevoClient) return brevoClient;
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn("BREVO_API_KEY not set. Emails will be logged only.");
      return null;
    }
    const client = new Brevo.TransactionalEmailsApi();
    client.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
    brevoClient = client;
    return client;
  } catch (error) {
    console.error("Failed to initialize Brevo client:", error);
    return null;
  }
}

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  senderEmail,
  senderName,
  attachments,
}: SendEmailArgs): Promise<{
  success: boolean;
  delivered: boolean;
  error?: string;
  providerMessageId?: string;
  timestamp: string;
}> => {
  const timestamp = new Date().toISOString();

  const client = getBrevoClient();
  const fromEmail = senderEmail || process.env.BREVO_SENDER_EMAIL;
  const fromName = senderName || process.env.BREVO_SENDER_NAME || undefined;

  if (!client || !fromEmail) {
    const missing = !client ? "BREVO_API_KEY" : "BREVO_SENDER_EMAIL";
    console.warn("[Email:dev-mode] Email NOT sent (missing config):", {
      to,
      subject,
      missing,
      timestamp,
    });
    return {
      success: true,
      delivered: false,
      error: `Email not sent: missing ${missing}`,
      timestamp,
    };
  }

  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.sender = {
      email: fromEmail,
      ...(fromName ? { name: fromName } : {}),
    };
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.textContent = text;
    if (attachments && attachments.length > 0) {
      sendSmtpEmail.attachment = attachments.map((a) => ({
        name: a.name,
        content: a.content,
      }));
    }

    const response = await client.sendTransacEmail(sendSmtpEmail);
    const messageId =
      (response as any)?.messageId ||
      (response as any)?.message?.messageId ||
      (response as any)?.messageIds?.[0];

    return { success: true, delivered: true, providerMessageId: messageId, timestamp };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Brevo send email failed:", error);
    return { success: false, delivered: false, error: message, timestamp };
  }
};
