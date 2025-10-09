// services/smsService.js
// Cloud Function mode - actual SMS sent by Firebase Functions

class SMSService {
  constructor() {
    console.log("✅ SMS Service configured (Cloud Function mode)");
    console.log("📱 SMS will be sent automatically by Firebase Functions");
  }

  // All methods just log and return success
  // The actual SMS is sent by onRideStatusChangev2 Cloud Function
  // when Firestore ride status changes

  async notifyRideAccepted(customerPhone, driverName, vehicleInfo, eta) {
    console.log("📱 SMS will be sent by Cloud Function: Ride Accepted");
    console.log(`   To: ${customerPhone}`);
    console.log(
      `   Driver: ${driverName}, Vehicle: ${vehicleInfo}, ETA: ${eta}`
    );
    return { success: true, mode: "cloud_function" };
  }

  async notifyDriverOnWay(customerPhone, driverName, eta) {
    console.log("📱 SMS will be sent by Cloud Function: Driver On Way");
    console.log(`   To: ${customerPhone}`);
    console.log(`   Driver: ${driverName}, ETA: ${eta}`);
    return { success: true, mode: "cloud_function" };
  }

  async notifyDriverArrived(customerPhone, driverName, vehicleInfo) {
    console.log("📱 SMS will be sent by Cloud Function: Driver Arrived");
    console.log(`   To: ${customerPhone}`);
    console.log(`   Driver: ${driverName}, Vehicle: ${vehicleInfo}`);
    return { success: true, mode: "cloud_function" };
  }

  async notifyTripStarted(customerPhone, driverName, destination) {
    console.log("📱 SMS will be sent by Cloud Function: Trip Started");
    console.log(`   To: ${customerPhone}`);
    console.log(`   Driver: ${driverName}, Destination: ${destination}`);
    return { success: true, mode: "cloud_function" };
  }

  async notifyTripCompleted(customerPhone, driverName, fare) {
    console.log("📱 SMS will be sent by Cloud Function: Trip Completed");
    console.log(`   To: ${customerPhone}`);
    console.log(`   Driver: ${driverName}, Fare: $${fare}`);
    return { success: true, mode: "cloud_function" };
  }

  async notifyTripCancelled(customerPhone, reason = null) {
    console.log("📱 SMS will be sent by Cloud Function: Trip Cancelled");
    console.log(`   To: ${customerPhone}`);
    console.log(`   Reason: ${reason || "N/A"}`);
    return { success: true, mode: "cloud_function" };
  }

  formatPhoneNumber(phone) {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    if (!phone.startsWith("+")) {
      return `+${cleaned}`;
    }
    return phone;
  }

  async testSMS(phoneNumber = "+1234567890") {
    console.log("🧪 Testing SMS service (Cloud Function mode)");
    console.log(`   Test message would be sent to: ${phoneNumber}`);
    console.log("   Actual SMS is sent by Firebase Cloud Functions");
    return { success: true, mode: "cloud_function", test: true };
  }

  isReady() {
    return true;
  }

  getStatus() {
    return {
      configured: true,
      mode: "cloud_function",
      message: "SMS handled automatically by Firebase Cloud Functions",
    };
  }
}

export default new SMSService();
