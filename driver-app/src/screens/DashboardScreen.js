import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  subscribeToNewRides,
  subscribeToActiveRides,
  updateRideStatus,
  setDriverOnlineStatus,
  getCurrentDriverId,
} from "../services/rideService";
import {
  setNewRides,
  setOnlineStatus,
  setActiveRides,
  setDriverLocation,
} from "../store/store";
import RideRequestCard from "../components/RideRequestsCard";
import LocationService from "../services/locationService";
import NotificationService from "../services/notificationService";
import EmailService from "../services/emailService";
import { Linking } from "react-native";
// import FirebaseTestComponent from "../components/FirebaseTestComponent";

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { newRides, activeRides, isOnline, driverLocation } = useSelector(
    (state) => state.rides
  );
  const [loading, setLoading] = useState(true);
  const [locationWatcher, setLocationWatcher] = useState(null);

  // Initialize services on component mount
  useEffect(() => {
    initializeServices();
    return () => {
      // Cleanup when component unmounts
      if (locationWatcher) {
        LocationService.stopLocationTracking();
      }
    };
  }, []);

  const initializeServices = async () => {
    // Initialize notifications
    await NotificationService.initialize();

    // Get initial location
    const location = await LocationService.getCurrentLocation();
    if (location) {
      dispatch(setDriverLocation(location));
    }

    // Load active rides immediately on app start
    const activeRidesUnsubscribe = subscribeToActiveRides(
      getCurrentDriverId(),
      (rides) => {
        dispatch(setActiveRides(rides));
        setLoading(false);
      }
    );

    // Store unsubscribe function for cleanup
    return activeRidesUnsubscribe;
  };

  useEffect(() => {
    let unsubscribe;

    if (isOnline) {
      // Subscribe to new rides
      unsubscribe = subscribeToNewRides((rides) => {
        dispatch(setNewRides(rides));
        setLoading(false);
      });

      // Start location tracking
      startLocationTracking();

      // Update driver online status in Firebase
      setDriverOnlineStatus(true);
    } else {
      dispatch(setNewRides([]));
      setLoading(false);

      // Stop location tracking
      stopLocationTracking();

      // Update driver offline status in Firebase
      setDriverOnlineStatus(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline, dispatch]);

  const startLocationTracking = async () => {
    const watcher = await LocationService.startLocationTracking((location) => {
      dispatch(setDriverLocation(location));
      // Update location in Firebase for real-time tracking
      // updateDriverLocation(location); // Uncomment when implementing real-time tracking
    });
    setLocationWatcher(watcher);
  };

  const stopLocationTracking = () => {
    if (locationWatcher) {
      LocationService.stopLocationTracking();
      setLocationWatcher(null);
    }
  };

  const toggleOnlineStatus = () => {
    if (!isOnline) {
      Alert.alert("Go Online?", "You'll start receiving ride requests", [
        { text: "Cancel", style: "cancel" },
        { text: "Go Online", onPress: () => dispatch(setOnlineStatus(true)) },
      ]);
    } else {
      dispatch(setOnlineStatus(false));
    }
  };

  const handleAcceptRide = async (ride) => {
    try {
      const savedProfile = await AsyncStorage.getItem("driverProfile");
      const driverProfile = savedProfile ? JSON.parse(savedProfile) : null;
      const currentLocation = await LocationService.getCurrentLocation();

      const driverInfo = {
        driverId: getCurrentDriverId(),
        driverName: driverProfile?.name || "Erdi Haciogullari",
        driverPhone: driverProfile?.phone || "",
        driverPhotoURL:
          driverProfile?.photoURL || "https://i.imgur.com/uYhkACU.jpeg",
        driverVehicle: driverProfile?.vehicle || {
          make: "Toyota",
          model: "RAV4 Prime",
          year: "2024",
          color: "White with Black Trim",
          licensePlate: "9LXJ115",
        },
        driver: {
          id: getCurrentDriverId(),
          name: driverProfile?.name || "Erdi Haciogullari",
          phone: driverProfile?.phone || "",
          photoURL:
            driverProfile?.photoURL || "https://i.imgur.com/uYhkACU.jpeg",
          vehicle: driverProfile?.vehicle || {
            make: "Toyota",
            model: "RAV4 Prime",
            year: "2024",
            color: "White with Black Trim",
            licensePlate: "9LXJ115",
          },
        },
        acceptedAt: new Date(),
        driverLocation: currentLocation,
      };

      await updateRideStatus(ride.id, "accepted", driverInfo);

      // ✅ FIXED EMAIL NOTIFICATION - Don't block on failure
      if (ride.customerEmail && EmailService.isReady()) {
        const emailMessage = ride.isScheduled
          ? `Hi! I'm Erdi, your NELA driver. Your ride is confirmed for ${new Date(
              ride.scheduledDateTime
            ).toLocaleString()}. See you then!`
          : `Hi! I'm Erdi, your NELA driver. I'm on my way to pick you up. ETA: 8 minutes.`;

        // Fire and forget - don't await
        EmailService.sendRideNotification(
          ride.customerEmail,
          "NELA Ride Accepted",
          emailMessage
        ).catch((err) => {
          console.warn("📧 Email failed silently:", err);
        });
      } else {
        console.log("📧 Email skipped (not configured or no customer email)");
      }

      // SMS PROMPT (this works reliably)
      const smsMessage = ride.isScheduled
        ? `Hi! I'm Erdi, your NELA driver. Your ride is confirmed for ${new Date(
            ride.scheduledDateTime
          ).toLocaleString()}. See you then!`
        : `Hi! I'm Erdi, your NELA driver. I'm on my way to pick you up. ETA: 8 minutes.`;

      Linking.openURL(
        `sms:${ride.customerPhone}?body=${encodeURIComponent(smsMessage)}`
      );

      const updatedActiveRides = [
        ...activeRides,
        { ...ride, status: "accepted", ...driverInfo },
      ];
      dispatch(setActiveRides(updatedActiveRides));

      const updatedNewRides = newRides.filter((r) => r.id !== ride.id);
      dispatch(setNewRides(updatedNewRides));

      NotificationService.sendRideUpdateNotification(
        "Ride Accepted",
        `You accepted a ride to ${ride.destination}`,
        ride.id
      );

      Alert.alert("Ride Accepted!", "Ride accepted successfully!", [
        { text: "OK", style: "default" },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to accept ride. Please try again.");
      console.error("Error accepting ride:", error);
    }
  };

  const handleDeclineRide = async (ride) => {
    try {
      // Update ride status to show no driver available
      await updateRideStatus(ride.id, "no_driver_available", {
        declinedBy: getCurrentDriverId(),
        declinedAt: new Date(),
        message: "No drivers available at this time. Please try again.",
      });

      // Remove from local state
      const updatedRides = newRides.filter((r) => r.id !== ride.id);
      dispatch(setNewRides(updatedRides));
    } catch (error) {
      console.error("Error declining ride:", error);
      // Still remove from local state even if Firebase update fails
      const updatedRides = newRides.filter((r) => r.id !== ride.id);
      dispatch(setNewRides(updatedRides));
    }
  };

  const navigateToPickup = (ride) => {
    // TODO: Implement navigation to pickup location
    // This would typically open a maps app or internal navigation
    console.log("Navigate to:", ride.pickupLocation);
  };

  const renderRideRequest = ({ item }) => (
    <RideRequestCard
      passengerName={item.passengerName || "Anonymous"}
      pickupLocation={item.pickupLocation || item.pickup?.address}
      destination={item.destination || item.dropoff?.address}
      estimatedFare={`$${item.estimatedFare || item.fare}`}
      estimatedTime={item.estimatedTime || "Unknown"}
      distance={item.distance || "Unknown"}
      passengerRating={item.passengerRating || 5.0}
      onAccept={() => handleAcceptRide(item)}
      onDecline={() => handleDeclineRide(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Online/Offline Toggle */}
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>
            {isOnline ? "You're Online" : "You're Offline"}
          </Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnlineStatus}
            trackColor={{ false: "#767577", true: "#3B82F6" }}
            thumbColor={isOnline ? "#ffffff" : "#f4f3f4"}
          />
        </View>
        <Text style={styles.statusSubtext}>
          {isOnline
            ? "Ready to receive ride requests"
            : "Turn on to start receiving requests"}
        </Text>

        {/* Show active rides count */}
        {activeRides.length > 0 && (
          <Text style={styles.activeRidesText}>
            {activeRides.length} active ride
            {activeRides.length !== 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Ride Requests */}
      <View style={styles.ridesSection}>
        <Text style={styles.sectionTitle}>
          {isOnline
            ? `New Requests (${newRides.length})`
            : "Go online to see requests"}
        </Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : newRides.length === 0 ? (
          <Text style={styles.emptyText}>
            {isOnline ? "No new ride requests" : "Turn on to receive requests"}
          </Text>
        ) : (
          <FlatList
            data={newRides}
            renderItem={renderRideRequest}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    padding: 16,
  },
  statusContainer: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a202c",
    letterSpacing: -0.4,
  },
  statusSubtext: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    lineHeight: 20,
  },
  activeRidesText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  ridesSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 60,
    lineHeight: 24,
  },
});
