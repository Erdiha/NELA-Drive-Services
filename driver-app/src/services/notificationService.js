// services/notificationService.js
// Email-only notifications - SMS handled by Cloud Function
// Enterprise-grade with comprehensive error handling

import EmailService from "./emailService";
import ReceiptService from "./receiptService";

class NotificationService {
  constructor() {
    this.isInitialized = true;
    this.failedNotifications = [];
    this.retryAttempts = 3;
    this.retryDelay = 2000;
  }

  async initialize() {
    console.log("📱 Notification Service initialized (Email-only mode)");
    console.log("📱 SMS handled by Cloud Function automatically");
    return true;
  }

  /**
   * Centralized error handler
   * @private
   */
  _handleError(context, error, customerEmail) {
    const errorLog = {
      context,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      customerEmail: customerEmail || "N/A",
    };

    console.error(`❌ Notification Error [${context}]:`, errorLog);
    this.failedNotifications.push(errorLog);
  }

  /**
   * Validate email
   * @private
   */
  _validateEmail(email) {
    if (!email) {
      return { valid: false, error: "Email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: `Invalid email format: ${email}` };
    }

    return { valid: true };
  }

  /**
   * Retry logic for failed operations
   * @private
   */
  async _retryOperation(fn, context, maxAttempts = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.warn(
          `⚠️ Retry ${attempt}/${maxAttempts} for ${context}: ${error.message}`
        );

        if (attempt < maxAttempts) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError;
  }

  /**
   * Safe email sender with validation and retry
   * @private
   */
  async _sendEmail(customerEmail, subject, message, context) {
    // Validate email
    const validation = this._validateEmail(customerEmail);
    if (!validation.valid) {
      console.warn(`⚠️ ${context}: ${validation.error}`);
      return { success: false, reason: validation.error, skipped: true };
    }

    // Check if EmailService is ready
    if (!EmailService.isReady()) {
      console.warn(`⚠️ ${context}: EmailJS not configured - skipping`);
      return { success: false, reason: "not_configured", skipped: true };
    }

    // Send with retry logic
    try {
      const result = await this._retryOperation(
        () =>
          EmailService.sendRideNotification(customerEmail, subject, message),
        context,
        this.retryAttempts
      );

      console.log(`✅ Email sent successfully: ${context}`);
      return { success: true, result };
    } catch (error) {
      this._handleError(context, error, customerEmail);
      return { success: false, error: error.message };
    }
  }

  /**
   * STAGE 1: RIDE ACCEPTED
   * Email: Confirmation with driver details
   * SMS: Handled by Cloud Function automatically
   */
  async notifyRideAccepted(rideData, driverData) {
    const context = "Ride Accepted";
    console.log(`📧 ${context} - Email notification`);
    console.log(`📱 ${context} - SMS will be sent by Cloud Function`);

    try {
      // Validate required data
      if (!rideData) {
        throw new Error("Missing ride data");
      }
      if (!driverData) {
        throw new Error("Missing driver data");
      }

      const {
        customerEmail,
        isScheduled,
        scheduledDateTime,
        pickupAddress,
        destinationAddress,
      } = rideData;
      const driverName =
        driverData.driverName || driverData.driver?.name || "Your driver";
      const driverVehicle =
        driverData.driverVehicle || driverData.driver?.vehicle;

      // Format vehicle info safely
      const vehicleInfo = driverVehicle
        ? `${driverVehicle.year || ""} ${driverVehicle.color || ""} ${
            driverVehicle.make || ""
          } ${driverVehicle.model || ""} (${
            driverVehicle.licensePlate || "N/A"
          })`.trim()
        : "your ride";

      // Build email message
      const emailSubject = isScheduled
        ? "✅ NELA Ride Scheduled"
        : "🚗 Your NELA Driver is On The Way!";

      const emailMessage = isScheduled
        ? `Hi! Your NELA ride has been confirmed.\n\nDriver: ${driverName}\nVehicle: ${vehicleInfo}\nScheduled Time: ${new Date(
            scheduledDateTime
          ).toLocaleString()}\n\nPickup: ${pickupAddress}\nDestination: ${destinationAddress}\n\nYour driver will arrive at the scheduled time. See you then!`
        : `Hi! Your NELA ride has been accepted.\n\nDriver: ${driverName}\nVehicle: ${vehicleInfo}\nETA: 8 minutes\n\nPickup: ${pickupAddress}\nDestination: ${destinationAddress}\n\nYour driver is on the way to pick you up!`;

      await this._sendEmail(customerEmail, emailSubject, emailMessage, context);

      return { success: true, context };
    } catch (error) {
      this._handleError(context, error, rideData?.customerEmail);
      // Don't throw - ride acceptance shouldn't fail due to notification
      return { success: false, error: error.message };
    }
  }

  /**
   * STAGE 2: DRIVER ARRIVED
   * No email needed - customer will see the car
   * SMS: Handled by Cloud Function automatically
   */
  async notifyDriverArrived(rideData, driverData) {
    const context = "Driver Arrived";
    console.log(`${context} - No email sent (not needed)`);
    console.log(`📱 ${context} - SMS will be sent by Cloud Function`);

    // No email needed for this stage
    return { success: true, context, type: "sms-only" };
  }

  /**
   * STAGE 3: TRIP STARTED
   * In-app only - no email or SMS needed
   */
  async notifyTripStarted(rideData, driverData) {
    const context = "Trip Started";
    console.log(`🛣️ ${context} - In-app notification only`);
    console.log(`   (Customer is in the car, no external notification needed)`);

    // No notifications needed - customer is in the car
    return { success: true, context, type: "in-app-only" };
  }

  /**
   * STAGE 4: TRIP COMPLETED
   * Email: Detailed receipt for records
   * SMS: Thank you message via Cloud Function
   */
  async notifyTripCompleted(rideData, driverData, receipt) {
    const context = "Trip Completed";
    console.log(`📧 ${context} - Email with receipt`);
    console.log(`📱 ${context} - SMS will be sent by Cloud Function`);

    try {
      // Validate required data
      if (!rideData) {
        throw new Error("Missing ride data");
      }

      const { customerEmail } = rideData;

      // Generate receipt if not provided
      let finalReceipt;
      try {
        finalReceipt = receipt || ReceiptService.generateReceipt(rideData);
      } catch (receiptError) {
        console.error("❌ Receipt generation failed:", receiptError);
        this._handleError(
          `${context} - Receipt Generation`,
          receiptError,
          customerEmail
        );

        // Create basic fallback receipt
        finalReceipt = {
          rideId: rideData.id || "N/A",
          finalFare: rideData.estimatedFare || rideData.fare || "0.00",
          customerName: rideData.customerName || "Valued Customer",
          pickupAddress:
            rideData.pickupAddress ||
            rideData.pickup?.address ||
            "Pickup location",
          destinationAddress:
            rideData.destinationAddress ||
            rideData.dropoff?.address ||
            "Destination",
          distance: rideData.distance || "N/A",
          duration: rideData.estimatedTime || "N/A",
          completedAt: new Date().toISOString(),
        };
      }

      // Format receipt for email
      const receiptText = ReceiptService.formatReceiptText(finalReceipt);

      // Build comprehensive email
      const emailSubject = "🎉 Trip Receipt - Thank You for Riding NELA!";
      const emailMessage = `Thank you for riding with NELA!\n\n${receiptText}\n\nWe hope you enjoyed your ride and look forward to serving you again.\n\nBook your next ride at nela.com\n\nHave feedback? Reply to this email!`;

      // Send email with receipt
      await this._sendEmail(customerEmail, emailSubject, emailMessage, context);

      // Log receipt for driver records
      console.log("📄 Receipt Generated:");
      console.log(receiptText);

      return { success: true, context, receipt: finalReceipt };
    } catch (error) {
      this._handleError(context, error, rideData?.customerEmail);
      // Don't throw - trip completion shouldn't fail due to notification
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: New ride notification (for driver app)
   */
  async sendNewRideNotification(rideData) {
    console.log(
      "📱 New ride notification (driver):",
      rideData?.passengerName || "Unknown"
    );
    return { success: true, type: "driver-notification" };
  }

  /**
   * Helper: Ride update notification (for driver app)
   */
  async sendRideUpdateNotification(title, body, rideId) {
    console.log(`📱 Ride update notification (driver): ${title}`);
    return { success: true, type: "driver-notification" };
  }

  /**
   * Helper: Payment notification (for driver app)
   */
  async sendPaymentNotification(amount, rideId) {
    console.log(`💰 Payment notification (driver): $${amount}`);
    return { success: true, type: "driver-notification" };
  }

  /**
   * Get failed notifications for monitoring
   */
  getFailedNotifications() {
    return [...this.failedNotifications];
  }

  /**
   * Clear failed notifications log
   */
  clearFailedNotifications() {
    const count = this.failedNotifications.length;
    this.failedNotifications = [];
    console.log(`🗑️ Cleared ${count} failed notification(s)`);
    return count;
  }

  /**
   * Health check
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      mode: "coordinated",
      smsHandler: "Cloud Function (automatic)",
      emailHandler: "Driver App (EmailJS)",
      emailServiceReady: EmailService.isReady(),
      failedNotificationsCount: this.failedNotifications.length,
    };
  }

  subscribeToNotifications() {
    return () => {};
  }

  getPushToken() {
    return null;
  }
}

export default new NotificationService();
