import { Alert } from "react-native";

// SMS Templates
export const SMS_TEMPLATES = {
  rideAccepted: (driverName, vehicleInfo, eta) =>
    `🚗 Your NELA ride has been accepted! ${driverName} is on the way in a ${vehicleInfo}. ETA: ${eta} min.`,

  driverOnWay: (driverName, eta) =>
    `🛣️ ${driverName} is heading to your pickup location. ETA: ${eta} min.`,

  driverArrived: (driverName, vehicleInfo) =>
    `📍 ${driverName} has arrived! Look for the ${vehicleInfo}.`,

  tripStarted: (driverName, destination) =>
    `🚀 Trip started! ${driverName} is taking you to ${destination}. Have a safe ride!`,

  tripCompleted: (driverName, fare) =>
    `✅ Trip completed! Thank you for riding with NELA. Fare: $${fare}. Rate your experience!`,

  tripCancelled: (reason) =>
    `❌ Your ride has been cancelled. ${
      reason || "We apologize for the inconvenience."
    } Book another ride anytime!`,
};

class SMSService {
  constructor() {
    this.isConfigured = false;
    this.twilioAccountSid = null;
    this.twilioAuthToken = null;
    this.twilioPhoneNumber = null;
    this.initializeService();
  }

  initializeService() {
    // Get Twilio credentials from environment
    this.twilioAccountSid = process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.EXPO_PUBLIC_TWILIO_PHONE_NUMBER;

    if (
      this.twilioAccountSid &&
      this.twilioAuthToken &&
      this.twilioPhoneNumber
    ) {
      this.isConfigured = true;
      console.log("✅ Twilio SMS Service configured");
      console.log(`📱 Using Twilio number: ${this.twilioPhoneNumber}`);
    } else {
      console.log("⚠️ SMS Service running in demo mode");
      console.log("Add these to your .env file for real SMS:");
      console.log("  EXPO_PUBLIC_TWILIO_ACCOUNT_SID");
      console.log("  EXPO_PUBLIC_TWILIO_AUTH_TOKEN");
      console.log("  EXPO_PUBLIC_TWILIO_PHONE_NUMBER");
    }
  }

  async sendSMS(to, message) {
    const formattedPhone = this.formatPhoneNumber(to);

    // Demo mode if not configured
    if (!this.isConfigured) {
      console.log("📱 SMS DEMO MODE:");
      console.log(`To: ${formattedPhone}`);
      console.log(`Message: ${message}`);
      console.log("-------------------");

      // Show alert in dev only
      if (__DEV__) {
        Alert.alert(
          "📱 SMS Demo",
          `Would send to: ${formattedPhone}\n\n${message}`,
          [{ text: "OK" }]
        );
      }

      return { success: true, messageId: "demo_" + Date.now(), mode: "demo" };
    }

    // Real Twilio SMS sending
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`;

      // Create Basic Auth header
      const credentials = `${this.twilioAccountSid}:${this.twilioAuthToken}`;
      const base64Credentials = btoa(credentials);

      // Prepare form data
      const formData = new URLSearchParams();
      formData.append("To", formattedPhone);
      formData.append("From", this.twilioPhoneNumber);
      formData.append("Body", message);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${base64Credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ SMS sent successfully via Twilio:", result.sid);
        return {
          success: true,
          messageId: result.sid,
          mode: "twilio",
          status: result.status,
        };
      } else {
        console.error("❌ Twilio SMS failed:", result.message);
        throw new Error(result.message || "SMS sending failed");
      }
    } catch (error) {
      console.error("❌ Twilio API error:", error);

      // Fallback to demo mode on error
      if (__DEV__) {
        Alert.alert(
          "SMS Error",
          `Failed to send SMS: ${error.message}\n\nMessage logged for manual follow-up.`,
          [{ text: "OK" }]
        );
      }

      return {
        success: false,
        error: error.message,
        fallback: true,
      };
    }
  }

  formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, "");

    // Add +1 if it's a 10-digit US number
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // Add + if it doesn't have one
    if (!phone.startsWith("+")) {
      return `+${cleaned}`;
    }

    return phone;
  }

  // Ride notification methods
  async notifyRideAccepted(
    customerPhone,
    driverName = "Erdi Haciogullari",
    vehicleInfo = "2024 White RAV4 Prime (9LXJ115)",
    eta = 8
  ) {
    if (!customerPhone) {
      console.warn("⚠️ No customer phone provided for ride accepted SMS");
      return { success: false, error: "No phone number" };
    }

    const message = SMS_TEMPLATES.rideAccepted(driverName, vehicleInfo, eta);
    return await this.sendSMS(customerPhone, message);
  }

  async notifyDriverOnWay(
    customerPhone,
    driverName = "Erdi Haciogullari",
    eta = 8
  ) {
    if (!customerPhone) {
      console.warn("⚠️ No customer phone provided for driver on way SMS");
      return { success: false, error: "No phone number" };
    }

    const message = SMS_TEMPLATES.driverOnWay(driverName, eta);
    return await this.sendSMS(customerPhone, message);
  }

  async notifyDriverArrived(
    customerPhone,
    driverName = "Erdi Haciogullari",
    vehicleInfo = "White RAV4 Prime"
  ) {
    if (!customerPhone) {
      console.warn("⚠️ No customer phone provided for driver arrived SMS");
      return { success: false, error: "No phone number" };
    }

    const message = SMS_TEMPLATES.driverArrived(driverName, vehicleInfo);
    return await this.sendSMS(customerPhone, message);
  }

  async notifyTripStarted(
    customerPhone,
    driverName = "Erdi Haciogullari",
    destination
  ) {
    if (!customerPhone) {
      console.warn("⚠️ No customer phone provided for trip started SMS");
      return { success: false, error: "No phone number" };
    }

    const message = SMS_TEMPLATES.tripStarted(driverName, destination);
    return await this.sendSMS(customerPhone, message);
  }

  async notifyTripCompleted(
    customerPhone,
    driverName = "Erdi Haciogullari",
    fare
  ) {
    if (!customerPhone) {
      console.warn("⚠️ No customer phone provided for trip completed SMS");
      return { success: false, error: "No phone number" };
    }

    const message = SMS_TEMPLATES.tripCompleted(driverName, fare);
    return await this.sendSMS(customerPhone, message);
  }

  async notifyTripCancelled(customerPhone, reason = null) {
    if (!customerPhone) {
      console.warn("⚠️ No customer phone provided for trip cancelled SMS");
      return { success: false, error: "No phone number" };
    }

    const message = SMS_TEMPLATES.tripCancelled(reason);
    return await this.sendSMS(customerPhone, message);
  }

  // Test method
  async testSMS(phoneNumber = "+1234567890") {
    console.log("🧪 Testing Twilio SMS service...");
    const result = await this.sendSMS(
      phoneNumber,
      "Test message from NELA Driver App 🚗"
    );
    console.log("🧪 Test result:", result);
    return result;
  }

  // Check if service is properly configured
  isReady() {
    return this.isConfigured;
  }

  // Get service status for debugging
  getStatus() {
    return {
      configured: this.isConfigured,
      phoneNumber: this.twilioPhoneNumber,
      hasAccountSid: !!this.twilioAccountSid,
      hasAuthToken: !!this.twilioAuthToken,
    };
  }
}

export default new SMSService();
