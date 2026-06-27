export type ConfirmationEmailContent = {
  subject: { en: string; "zh-TW": string };
  heading: { en: string; "zh-TW": string };
  message: { en: string; "zh-TW": string };
  footer: { en: string; "zh-TW": string };
};

export const DEFAULT_CONFIRMATION_EMAIL: ConfirmationEmailContent = {
  subject: {
    en: "Welcome to CpffOnline newsletter",
    "zh-TW": "歡迎訂閱 CpffOnline 電子報",
  },
  heading: {
    en: "Welcome to CpffOnline newsletter",
    "zh-TW": "歡迎訂閱 CpffOnline 電子報",
  },
  message: {
    en: "Thanks for subscribing. We'll send updates, promotions, and new arrivals to:",
    "zh-TW": "感謝您訂閱！我們會把最新消息、優惠和新品資訊發送到：",
  },
  footer: {
    en: "You can unsubscribe anytime from future campaign emails.",
    "zh-TW": "您可在日後活動電郵中隨時取消訂閱。",
  },
};

function pickLang(
  field: Partial<{ en: string; "zh-TW": string }> | undefined,
  lang: "en" | "zh-TW",
  fallback: string
): string {
  const value = field?.[lang]?.trim();
  return value || fallback;
}

export function resolveConfirmationEmailContent(
  stored?: Partial<ConfirmationEmailContent> | null
): ConfirmationEmailContent {
  return {
    subject: {
      en: pickLang(stored?.subject, "en", DEFAULT_CONFIRMATION_EMAIL.subject.en),
      "zh-TW": pickLang(
        stored?.subject,
        "zh-TW",
        DEFAULT_CONFIRMATION_EMAIL.subject["zh-TW"]
      ),
    },
    heading: {
      en: pickLang(stored?.heading, "en", DEFAULT_CONFIRMATION_EMAIL.heading.en),
      "zh-TW": pickLang(
        stored?.heading,
        "zh-TW",
        DEFAULT_CONFIRMATION_EMAIL.heading["zh-TW"]
      ),
    },
    message: {
      en: pickLang(stored?.message, "en", DEFAULT_CONFIRMATION_EMAIL.message.en),
      "zh-TW": pickLang(
        stored?.message,
        "zh-TW",
        DEFAULT_CONFIRMATION_EMAIL.message["zh-TW"]
      ),
    },
    footer: {
      en: pickLang(stored?.footer, "en", DEFAULT_CONFIRMATION_EMAIL.footer.en),
      "zh-TW": pickLang(
        stored?.footer,
        "zh-TW",
        DEFAULT_CONFIRMATION_EMAIL.footer["zh-TW"]
      ),
    },
  };
}

export function buildSubscribeConfirmationEmail(
  email: string,
  stored?: Partial<ConfirmationEmailContent> | null
) {
  const content = resolveConfirmationEmailContent(stored);
  const subject = `${content.subject.en} / ${content.subject["zh-TW"]}`;

  const text = `${content.heading.en}

${content.message.en}
${email}

${content.footer.en}

---

${content.heading["zh-TW"]}
${content.message["zh-TW"]}
${email}

${content.footer["zh-TW"]}`;

  const html = `<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;color:#333;line-height:1.5;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="margin:0 0 12px;">${content.heading.en}</h2>
      <p>${content.message.en}</p>
      <p><strong>${email}</strong></p>
      <p style="margin-bottom:24px;">${content.footer.en}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <h2 style="margin:0 0 12px;">${content.heading["zh-TW"]}</h2>
      <p>${content.message["zh-TW"]}</p>
      <p><strong>${email}</strong></p>
      <p>${content.footer["zh-TW"]}</p>
    </div>
  </body>
</html>`;

  return { subject, text, html };
}
