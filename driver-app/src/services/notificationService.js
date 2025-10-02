class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    console.log("📱 Notifications disabled (using SMS instead)");
    return true;
  }

  async sendNewRideNotification(rideData) {
    console.log(
      "📱 New ride notification (SMS will be sent):",
      rideData.passengerName
    );
  }

  async sendRideUpdateNotification(title, body, rideId) {
    console.log("📱 Ride update notification:", title);
  }

  async sendPaymentNotification(amount, rideId) {
    console.log("💰 Payment notification: $" + amount);
  }

  subscribeToNotifications() {
    return () => {};
  }

  getPushToken() {
    return null;
  }
}

export default new NotificationService();
