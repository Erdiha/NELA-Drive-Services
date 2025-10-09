// services/emailSErvice.js
// Fixed EmailJS integration with proper error handling

const SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EXPO_PUBLIC_EMAILJS_PRIVATE_KEY;

class EmailService {
  constructor() {
    this.isConfigured = !!(
      SERVICE_ID &&
      TEMPLATE_ID &&
      PUBLIC_KEY &&
      PRIVATE_KEY
    );

    if (!this.isConfigured) {
      console.log("⚠️ EmailJS not fully configured - emails will be skipped");
      console.log("  Missing:", {
        SERVICE_ID: !SERVICE_ID,
        TEMPLATE_ID: !TEMPLATE_ID,
        PUBLIC_KEY: !PUBLIC_KEY,
        PRIVATE_KEY: !PRIVATE_KEY,
      });
    } else {
      console.log("✅ EmailJS configured and ready");
    }
  }

  async sendRideNotification(to, subject, message) {
    if (!to || !to.includes("@")) {
      console.log("⚠️ No valid email, skipping");
      return { success: false, reason: "no_email", skipped: true };
    }

    // ✅ Skip silently if not configured
    if (!this.isConfigured) {
      console.log("📧 Email skipped (not configured):", to);
      return { success: false, reason: "not_configured", skipped: true };
    }

    try {
      console.log("📧 Sending via EmailJS to:", to);

      const response = await fetch(
        "https://api.emailjs.com/api/v1.0/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: PUBLIC_KEY,
            accessToken: PRIVATE_KEY,
            template_params: {
              to_email: to,
              subject: subject,
              message: message,
              reply_to: "erdiha@gmail.com",
              from_name: "NELA Rides",
            },
          }),
        }
      );

      // ✅ FIXED: Handle different response types
      if (response.ok) {
        // EmailJS returns "OK" as plain text on success, not JSON
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          console.log("✅ Email sent successfully (JSON response)");
          return { success: true, result };
        } else {
          const textResult = await response.text();
          console.log("✅ Email sent successfully:", textResult);
          return { success: true, message: textResult };
        }
      } else {
        // Try to parse error as text first
        let errorMessage;
        try {
          const errorText = await response.text();
          console.warn("⚠️ EmailJS failed:", errorText);
          errorMessage = errorText;
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}`;
        }

        return { success: false, error: errorMessage, skipped: true };
      }
    } catch (error) {
      console.warn("⚠️ Email failed:", error.message);

      // ✅ Graceful failure - don't break the flow
      return {
        success: false,
        error: error.message,
        skipped: true,
      };
    }
  }

  isReady() {
    return this.isConfigured;
  }
}

export default new EmailService();
