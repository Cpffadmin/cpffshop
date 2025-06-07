export class DevEmailService {
  static async sendEmail(to: string, subject: string, content: string) {
    console.log("\n📧 Development Email Service:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", content);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return true;
  }

  static async sendOrderUpdateEmail(email: string, enabled: boolean) {
    return this.sendEmail(
      email,
      "Notification Preference Updated",
      `Order updates notifications have been ${
        enabled ? "enabled" : "disabled"
      } for your account.`
    );
  }

  static async sendPromotionalEmail(email: string, enabled: boolean) {
    return this.sendEmail(
      email,
      "Promotional Notifications Updated",
      `Promotional notifications have been ${
        enabled ? "enabled" : "disabled"
      } for your account.`
    );
  }
}
