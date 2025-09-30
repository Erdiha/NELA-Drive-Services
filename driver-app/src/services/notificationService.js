import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permission not granted");
        return false;
      }

      // Configure notification channels for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("ride-requests", {
          name: "Ride Requests",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3B82F6",
        });
      }

      this.isInitialized = true;
      console.log("Notifications initialized");
      return true;
    } catch (error) {
      console.error("Error initializing notifications:", error);
      return false;
    }
  }

  async sendNewRideNotification(rideData) {
    if (!this.isInitialized) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚗 New Ride Request!",
          body: `${rideData.passengerName || "Someone"} needs a ride to ${
            rideData.destination
          }`,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  async sendRideUpdateNotification(title, body, rideId) {
    if (!this.isInitialized) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  async sendPaymentNotification(amount, rideId) {
    if (!this.isInitialized) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💰 Payment Received",
          body: `You earned $${amount} for your trip!`,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }

  // Dummy methods for compatibility
  subscribeToNotifications() {
    return () => {};
  }

  getPushToken() {
    return null;
  }
}

export default new NotificationService();
