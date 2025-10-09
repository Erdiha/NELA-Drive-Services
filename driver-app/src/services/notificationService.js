// services/notificationService.js
// Complete notification orchestration for all ride stages

import SMSService from "./smsService";
import EmailService from "./emailService";
import ReceiptService from "./receiptService";

class NotificationService {
  constructor() {
    this.isInitialized = true;
  }

  async initialize() {
    console.log("📱 Notification Service Ready");
    return true;
  }

  /**
   * STAGE 1: RIDE ACCEPTED
   * Driver accepts the ride - notify customer
   */
  async notifyRideAccepted(rideData, driverData) {
    console.log("🚀 Notifying customer: Ride Accepted");

    const { customerPhone, customerEmail, isScheduled, scheduledDateTime } =
      rideData;
    const driverName =
      driverData.driverName || driverData.driver?.name || "Your driver";
    const driverVehicle =
      driverData.driverVehicle || driverData.driver?.vehicle;

    // Format vehicle info
    const vehicleInfo = driverVehicle
      ? `${driverVehicle.year} ${driverVehicle.color} ${driverVehicle.make} ${driverVehicle.model} (${driverVehicle.licensePlate})`
      : "your ride";

    const eta = isScheduled ? "as scheduled" : "8 minutes";

    // SMS Notification
    if (customerPhone) {
      try {
        await SMSService.notifyRideAccepted(
          customerPhone,
          driverName,
          vehicleInfo,
          isScheduled ? "Scheduled" : 8
        );
        console.log("✅ SMS sent: Ride Accepted");
      } catch (error) {
        console.error("❌ SMS failed:", error.message);
      }
    }

    // Email Notification
    if (customerEmail && EmailService.isReady()) {
      try {
        const emailSubject = isScheduled
          ? "NELA Ride Scheduled ✅"
          : "Your NELA Driver is On The Way! 🚗";

        const emailMessage = isScheduled
          ? `Hi! Your NELA ride has been confirmed.\n\nDriver: ${driverName}\nVehicle: ${vehicleInfo}\nScheduled Time: ${new Date(
              scheduledDateTime
            ).toLocaleString()}\n\nYour driver will arrive at the scheduled time. See you then!`
          : `Hi! Your NELA ride has been accepted.\n\nDriver: ${driverName}\nVehicle: ${vehicleInfo}\nETA: ${eta}\n\nYour driver is on the way to pick you up!`;

        await EmailService.sendRideNotification(
          customerEmail,
          emailSubject,
          emailMessage
        );
        console.log("✅ Email sent: Ride Accepted");
      } catch (error) {
        console.error("❌ Email failed:", error.message);
      }
    }
  }

  /**
   * STAGE 2: DRIVER ARRIVED
   * Driver marks as arrived at pickup
   */
  async notifyDriverArrived(rideData, driverData) {
    console.log("📍 Notifying customer: Driver Arrived");

    const { customerPhone, customerEmail } = rideData;
    const driverName =
      driverData.driverName || driverData.driver?.name || "Your driver";
    const driverVehicle =
      driverData.driverVehicle || driverData.driver?.vehicle;

    const vehicleInfo = driverVehicle
      ? `${driverVehicle.color} ${driverVehicle.make} ${driverVehicle.model}`
      : "your ride";

    // SMS Notification
    if (customerPhone) {
      try {
        await SMSService.notifyDriverArrived(
          customerPhone,
          driverName,
          vehicleInfo
        );
        console.log("✅ SMS sent: Driver Arrived");
      } catch (error) {
        console.error("❌ SMS failed:", error.message);
      }
    }

    // Email Notification
    if (customerEmail && EmailService.isReady()) {
      try {
        const emailMessage = `${driverName} has arrived at your pickup location!\n\nLook for: ${vehicleInfo}\nLicense Plate: ${
          driverData.driverVehicle?.licensePlate || "See app"
        }\n\nYour driver is waiting for you outside.`;

        await EmailService.sendRideNotification(
          customerEmail,
          "Your NELA Driver Has Arrived! 📍",
          emailMessage
        );
        console.log("✅ Email sent: Driver Arrived");
      } catch (error) {
        console.error("❌ Email failed:", error.message);
      }
    }
  }

  /**
   * STAGE 3: TRIP STARTED
   * Driver starts the trip
   */
  async notifyTripStarted(rideData, driverData) {
    console.log("🛣️ Notifying customer: Trip Started");

    const { customerPhone, customerEmail, destination, dropoff } = rideData;
    const driverName =
      driverData.driverName || driverData.driver?.name || "Your driver";
    const destinationAddress =
      destination || dropoff?.address || "your destination";

    // SMS Notification
    if (customerPhone) {
      try {
        await SMSService.notifyTripStarted(
          customerPhone,
          driverName,
          destinationAddress
        );
        console.log("✅ SMS sent: Trip Started");
      } catch (error) {
        console.error("❌ SMS failed:", error.message);
      }
    }

    // Email Notification
    if (customerEmail && EmailService.isReady()) {
      try {
        const emailMessage = `Your trip has started!\n\n${driverName} is taking you to:\n${destinationAddress}\n\nSit back, relax, and enjoy your ride with NELA!`;

        await EmailService.sendRideNotification(
          customerEmail,
          "Trip Started - Enjoy Your Ride! 🚀",
          emailMessage
        );
        console.log("✅ Email sent: Trip Started");
      } catch (error) {
        console.error("❌ Email failed:", error.message);
      }
    }
  }

  /**
   * STAGE 4: TRIP COMPLETED
   * Trip is complete - send receipt
   */
  async notifyTripCompleted(rideData, driverData, receipt) {
    console.log("🏁 Notifying customer: Trip Completed");

    const { customerPhone, customerEmail } = rideData;
    const driverName =
      driverData.driverName || driverData.driver?.name || "Your driver";
    const fare =
      rideData.estimatedFare || rideData.fare || receipt?.finalFare || "0.00";

    // Generate receipt if not provided
    const finalReceipt = receipt || ReceiptService.generateReceipt(rideData);

    // SMS Notification
    if (customerPhone) {
      try {
        await SMSService.notifyTripCompleted(customerPhone, driverName, fare);
        console.log("✅ SMS sent: Trip Completed");
      } catch (error) {
        console.error("❌ SMS failed:", error.message);
      }
    }

    // Email Notification with Receipt
    if (customerEmail && EmailService.isReady()) {
      try {
        const receiptHTML = ReceiptService.formatReceiptHTML(finalReceipt);
        const receiptText = ReceiptService.formatReceiptText(finalReceipt);

        // Send HTML email with receipt
        const emailMessage = `Trip completed! Thank you for riding with NELA.\n\n${receiptText}\n\nWe hope you enjoyed your ride!\n\nBook again anytime at nela.com`;

        await EmailService.sendRideNotification(
          customerEmail,
          "Trip Receipt - Thank You for Riding NELA! 🎉",
          emailMessage
        );
        console.log("✅ Email sent: Trip Completed with Receipt");
      } catch (error) {
        console.error("❌ Email failed:", error.message);
      }
    }

    // Log receipt for driver records
    console.log("📄 Receipt Generated:");
    console.log(ReceiptService.formatReceiptText(finalReceipt));
  }

  /**
   * Helper: New ride notification (for driver)
   */
  async sendNewRideNotification(rideData) {
    console.log(
      "📱 New ride notification (for driver):",
      rideData.passengerName
    );
    // This is for the driver app - could add sound/vibration here
  }

  async sendRideUpdateNotification(title, body, rideId) {
    console.log("📱 Ride update notification:", title);
    // This is for the driver app - could add push notifications here
  }

  async sendPaymentNotification(amount, rideId) {
    console.log("💰 Payment notification: $" + amount);
    // This is for the driver app
  }

  subscribeToNotifications() {
    return () => {};
  }

  getPushToken() {
    return null;
  }
}

export default new NotificationService();
