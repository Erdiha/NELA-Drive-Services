import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
  Platform,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { updateRideStatus } from "../services/rideService";
import {
  updateRideStatus as updateLocalRideStatus,
  removeActiveRide,
  addCompletedRide,
} from "../store/store";
import LocationService from "../services/locationService";
import RideMap from "../components/RideMap";

const RideDetailsScreen = ({ route, navigation }) => {
  const { rideId } = route.params;
  const dispatch = useDispatch();
  const { activeRides, driverLocation } = useSelector((state) => state.rides);
  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [distanceToDestination, setDistanceToDestination] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(null);
  const [elapsedTime, setElapsedTime] = useState("00:00");

  useEffect(() => {
    const foundRide = activeRides.find((r) => r.id === rideId);
    setRide(foundRide);
  }, [rideId, activeRides]);

  // Calculate elapsed time for in-progress trips
  useEffect(() => {
    if (!ride || ride.status !== "in_progress") return;

    const updateElapsedTime = () => {
      const startTime = ride.startedAt ? new Date(ride.startedAt) : new Date();
      const now = new Date();
      const diffMs = now - startTime;

      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);

      setElapsedTime(
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
          2,
          "0"
        )}`
      );
    };

    updateElapsedTime();
    const interval = setInterval(updateElapsedTime, 1000);
    return () => clearInterval(interval);
  }, [ride]);

  // Calculate distance and ETA in real-time
  useEffect(() => {
    if (!ride || !driverLocation) return;

    const updateDistanceAndETA = () => {
      const destination =
        ride.status === "accepted" || ride.status === "arrived"
          ? ride.pickup
          : ride.dropoff;

      if (destination?.latitude && destination?.longitude) {
        const distanceKm = LocationService.calculateDistance(
          driverLocation.latitude,
          driverLocation.longitude,
          destination.latitude,
          destination.longitude
        );

        const distanceMiles = (distanceKm * 0.621371).toFixed(1);
        setDistanceToDestination(distanceMiles);

        const eta = Math.round((parseFloat(distanceMiles) / 25) * 60);
        setEtaMinutes(eta);
      }
    };

    updateDistanceAndETA();
    const interval = setInterval(updateDistanceAndETA, 15000);
    return () => clearInterval(interval);
  }, [ride, driverLocation]);

  const getStatusInfo = (status) => {
    switch (status) {
      case "accepted":
        return {
          title: "Heading to Pickup",
          color: "#3B82F6",
          nextAction: "Mark as Arrived",
          nextStatus: "arrived",
        };
      case "arrived":
        return {
          title: "Arrived at Pickup",
          color: "#F59E0B",
          nextAction: "Start Trip",
          nextStatus: "in_progress",
        };
      case "in_progress":
        return {
          title: "Trip in Progress",
          color: "#10B981",
          nextAction: "Complete Trip",
          nextStatus: "completed",
        };
      default:
        return {
          title: "Unknown Status",
          color: "#6B7280",
          nextAction: null,
          nextStatus: null,
        };
    }
  };

  const openNavigation = () => {
    const destination =
      ride.status === "accepted" || ride.status === "arrived"
        ? ride.pickup
        : ride.dropoff;

    if (!destination) {
      Alert.alert("Error", "Destination not available");
      return;
    }

    const { latitude, longitude } = destination;

    Alert.alert(
      "Open Navigation",
      "Choose your navigation app:",
      [
        {
          text: "Google Maps",
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`,
              android: `google.navigation:q=${latitude},${longitude}&mode=d`,
            });

            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
                Linking.openURL(webUrl);
              }
            });
          },
        },
        {
          text: "Waze",
          onPress: () => {
            const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Alert.alert(
                  "Waze Not Installed",
                  "Please install Waze to use this option"
                );
              }
            });
          },
        },
        {
          text: "Apple Maps",
          onPress: () => {
            const url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
            Linking.openURL(url);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    try {
      const updateData = { status: newStatus };
      if (newStatus === "in_progress") {
        updateData.startedAt = new Date().toISOString();
      }

      await updateRideStatus(ride.id, newStatus, updateData);
      dispatch(updateLocalRideStatus({ rideId: ride.id, status: newStatus }));

      const updatedRide = { ...ride, ...updateData };
      setRide(updatedRide);

      if (newStatus === "completed") {
        handleTripCompletion();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update ride status");
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTripCompletion = () => {
    Alert.alert(
      "Trip Completed!",
      `You earned $${ride.estimatedFare || ride.fare}`,
      [
        {
          text: "View Earnings",
          onPress: () => navigation.navigate("Earnings"),
        },
        {
          text: "Back to Dashboard",
          onPress: () => navigation.navigate("Dashboard"),
        },
      ]
    );

    dispatch(addCompletedRide({ ...ride, status: "completed" }));
    dispatch(removeActiveRide(ride.id));
  };

  const handleCancelRide = () => {
    Alert.alert(
      "Cancel Trip?",
      "Are you sure you want to cancel this trip?",
      [
        {
          text: "No, Keep Trip",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await updateRideStatus(ride.id, "cancelled", {
                cancelledBy: "driver",
                cancelledAt: new Date(),
                cancelReason: "Driver cancelled",
              });

              dispatch(removeActiveRide(ride.id));

              Alert.alert("Trip Cancelled", "The trip has been cancelled.", [
                {
                  text: "OK",
                  onPress: () => navigation.navigate("Dashboard"),
                },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to cancel trip");
              console.error("Error cancelling trip:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const callPassenger = () => {
    const phone = ride.customerPhone || ride.passengerPhone;
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert("No Phone Number", "Passenger phone number not available");
    }
  };

  const sendMessage = () => {
    const phone = ride.customerPhone || ride.passengerPhone;
    if (phone) {
      Linking.openURL(`sms:${phone}`);
    } else {
      Alert.alert("No Phone Number", "Passenger phone number not available");
    }
  };

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(ride.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.statusHeader, { backgroundColor: statusInfo.color }]}
        >
          <Text style={styles.statusTitle}>{statusInfo.title}</Text>
          {ride.status === "in_progress" && (
            <Text style={styles.timerText}>⏱️ {elapsedTime}</Text>
          )}
        </View>

        {(ride.status === "accepted" || ride.status === "in_progress") &&
          distanceToDestination && (
            <View style={styles.liveStatsCard}>
              <View style={styles.liveStatItem}>
                <Text style={styles.liveStatIcon}>📍</Text>
                <View>
                  <Text style={styles.liveStatValue}>
                    {distanceToDestination}
                  </Text>
                  <Text style={styles.liveStatLabel}>miles</Text>
                </View>
              </View>
              <View style={styles.liveStatDivider} />
              <View style={styles.liveStatItem}>
                <Text style={styles.liveStatIcon}>⏱️</Text>
                <View>
                  <Text style={styles.liveStatValue}>{etaMinutes}</Text>
                  <Text style={styles.liveStatLabel}>minutes</Text>
                </View>
              </View>
            </View>
          )}

        {statusInfo.nextAction && (
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              { backgroundColor: statusInfo.color },
            ]}
            onPress={() => handleStatusUpdate(statusInfo.nextStatus)}
            disabled={loading}
          >
            <Text style={styles.primaryActionText}>
              {loading ? "Updating..." : statusInfo.nextAction}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.quickAction} onPress={openNavigation}>
            <Text style={styles.quickActionIcon}>🧭</Text>
            <Text style={styles.quickActionText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={callPassenger}>
            <Text style={styles.quickActionIcon}>📞</Text>
            <Text style={styles.quickActionText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={sendMessage}>
            <Text style={styles.quickActionIcon}>💬</Text>
            <Text style={styles.quickActionText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickAction, styles.cancelAction]}
            onPress={handleCancelRide}
          >
            <Text style={styles.quickActionIcon}>❌</Text>
            <Text style={[styles.quickActionText, styles.cancelText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.compactCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Passenger</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.ratingText}>
                {ride.passengerRating || 5.0}
              </Text>
            </View>
          </View>
          <Text style={styles.passengerNameCompact}>
            {ride.passengerName || "Anonymous"}
          </Text>
        </View>
        {/* Customer Contact Info */}
        <View style={styles.compactCard}>
          <Text style={styles.cardTitle}>Contact</Text>
          <View style={styles.contactRow}>
            <Text style={styles.contactLabel}>📞 Phone:</Text>
            <Text style={styles.contactValue}>
              {ride.customerPhone || ride.passengerPhone || "Not provided"}
            </Text>
          </View>
          {(ride.customerEmail || ride.passengerEmail) && (
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>📧 Email:</Text>
              <Text style={styles.contactValue} numberOfLines={1}>
                {ride.customerEmail || ride.passengerEmail}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.compactCard}>
          <Text style={styles.cardTitle}>Route</Text>
          <View style={styles.compactLocationRow}>
            <View style={styles.pickupDotSmall} />
            <Text style={styles.compactLocationText} numberOfLines={1}>
              {ride.pickup?.address || ride.pickupLocation}
            </Text>
          </View>
          <View style={styles.compactRouteLine} />
          <View style={styles.compactLocationRow}>
            <View style={styles.destinationDotSmall} />
            <Text style={styles.compactLocationText} numberOfLines={1}>
              {ride.dropoff?.address || ride.destination}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Distance</Text>
            <Text style={styles.infoValue}>{ride.distance || "N/A"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{ride.estimatedTime || "N/A"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Fare</Text>
            <Text style={styles.infoValue}>
              ${ride.estimatedFare || ride.fare}
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "#3B82F6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statusHeader: {
    padding: 20,
    paddingBottom: 18,
    alignItems: "center",
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  timerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginTop: 6,
    opacity: 0.95,
  },
  liveStatsCard: {
    backgroundColor: "#10b981",
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  liveStatItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  liveStatIcon: {
    fontSize: 28,
    marginRight: 8,
  },
  liveStatLabel: {
    fontSize: 11,
    color: "#ffffff",
    opacity: 0.85,
  },
  liveStatValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
  },
  liveStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: "#ffffff",
    opacity: 0.3,
    marginHorizontal: 12,
  },
  primaryActionButton: {
    margin: 16,
    marginTop: 8,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
  },
  quickActionsRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  quickAction: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
  cancelAction: {
    backgroundColor: "#fef2f2",
  },
  cancelText: {
    color: "#dc2626",
  },
  compactCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  star: {
    fontSize: 12,
    marginRight: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400e",
  },
  passengerNameCompact: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  compactLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  pickupDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 10,
  },
  destinationDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#EF4444",
    marginRight: 10,
  },
  compactRouteLine: {
    width: 1,
    height: 12,
    backgroundColor: "#e5e7eb",
    marginLeft: 3,
    marginVertical: 2,
  },
  compactLocationText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  infoGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  infoItem: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  contactLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
});

export default RideDetailsScreen;
