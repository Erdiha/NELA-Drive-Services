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
import { LinearGradient } from "expo-linear-gradient";
import theme from "../theme/theme";
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
          title: "🚗 Heading to Pickup",
          nextAction: "✓ Mark as Arrived",
          nextStatus: "arrived",
        };
      case "arrived":
        return {
          title: "📍 Arrived at Pickup",
          nextAction: "▶ Start Trip",
          nextStatus: "in_progress",
        };
      case "in_progress":
        return {
          title: "🛣️ Trip in Progress",
          nextAction: "🏁 Complete Trip",
          nextStatus: "completed",
        };
      default:
        return {
          title: "Unknown Status",
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
        {/* Status Header with Gradient */}
        <View
          style={[styles.statusHeader, { backgroundColor: statusInfo.color }]}
        >
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>{statusInfo.title}</Text>
            {ride.status === "in_progress" && (
              <View style={styles.timerBadge}>
                <Text style={styles.timerText}>⏱️ {elapsedTime}</Text>
              </View>
            )}
          </View>
          <View style={styles.fareHeader}>
            <Text style={styles.fareLabel}>Trip Fare</Text>
            <Text style={styles.fareAmount}>
              ${ride.estimatedFare || ride.fare}
            </Text>
          </View>
        </View>
        {/* Live Stats Card */}
        {(ride.status === "accepted" || ride.status === "in_progress") &&
          distanceToDestination && (
            <LinearGradient
              colors={["#ecfdf5", "#d1fae5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.liveStatsCard}
            >
              <View style={styles.liveStatItem}>
                <View style={styles.statIconCircle}>
                  <Text style={styles.liveStatIcon}>📍</Text>
                </View>
                <View>
                  <Text style={styles.liveStatValue}>
                    {distanceToDestination}
                  </Text>
                  <Text style={styles.liveStatLabel}>miles away</Text>
                </View>
              </View>
              <View style={styles.liveStatDivider} />
              <View style={styles.liveStatItem}>
                <View style={styles.statIconCircle}>
                  <Text style={styles.liveStatIcon}>⏱️</Text>
                </View>
                <View>
                  <Text style={styles.liveStatValue}>{etaMinutes}</Text>
                  <Text style={styles.liveStatLabel}>minutes</Text>
                </View>
              </View>
            </LinearGradient>
          )}

        {/* Primary Action Button */}
        {statusInfo.nextAction && (
          <TouchableOpacity
            style={styles.primaryActionWrapper}
            onPress={() => handleStatusUpdate(statusInfo.nextStatus)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={theme.gradients.primary.start}
              end={theme.gradients.primary.end}
              style={styles.primaryActionButton}
            >
              <Text style={styles.primaryActionText}>
                {loading ? "Updating..." : statusInfo.nextAction}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Actions Row */}
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
            <Text style={styles.quickActionIcon}>✕</Text>
            <Text style={[styles.quickActionText, styles.cancelText]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>

        {/* Passenger Card */}
        <View style={styles.sectionContainer}>
          <View style={styles.gradientBorder}>
            <View style={styles.compactCard}>
              <Text style={styles.sectionTitle}>👤 PASSENGER</Text>
              <View style={styles.passengerRow}>
                <LinearGradient
                  colors={theme.gradients.primary.colors}
                  start={theme.gradients.primary.start}
                  end={theme.gradients.primary.end}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>
                    {(ride.passengerName || "A").charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerNameCompact}>
                    {ride.passengerName || "Anonymous"}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.star}>⭐</Text>
                    <Text style={styles.ratingText}>
                      {ride.passengerRating || 5.0}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Contact Info in Same Card */}
              <View style={styles.divider} />
              <View style={styles.contactSection}>
                <View style={styles.contactRow}>
                  <Text style={styles.contactIcon}>📞</Text>
                  <Text style={styles.contactValue}>
                    {ride.customerPhone ||
                      ride.passengerPhone ||
                      "Not provided"}
                  </Text>
                </View>
                {(ride.customerEmail || ride.passengerEmail) && (
                  <View style={styles.contactRow}>
                    <Text style={styles.contactIcon}>📧</Text>
                    <Text style={styles.contactValue} numberOfLines={1}>
                      {ride.customerEmail || ride.passengerEmail}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Route Card */}
        <View style={styles.sectionContainer}>
          <LinearGradient
            colors={["#faf5ff", "#f3e8ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.routeCard}
          >
            <Text style={styles.sectionTitle}>🗺️ ROUTE</Text>
            <View style={styles.routeContent}>
              <View style={styles.compactLocationRow}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.pickupDotLarge}
                >
                  <Text style={styles.dotText}>A</Text>
                </LinearGradient>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>PICKUP</Text>
                  <Text style={styles.compactLocationText} numberOfLines={2}>
                    {ride.pickup?.address || ride.pickupLocation}
                  </Text>
                </View>
              </View>
              <View style={styles.compactRouteLine} />
              <View style={styles.compactLocationRow}>
                <LinearGradient
                  colors={["#EF4444", "#DC2626"]}
                  style={styles.destinationDotLarge}
                >
                  <Text style={styles.dotText}>B</Text>
                </LinearGradient>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationLabel}>DROPOFF</Text>
                  <Text style={styles.compactLocationText} numberOfLines={2}>
                    {ride.dropoff?.address || ride.destination}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Trip Info Grid */}
        <View style={styles.infoGrid}>
          <LinearGradient
            colors={["#dbeafe", "#bfdbfe"]}
            style={styles.infoItem}
          >
            <Text style={styles.infoIcon}>📏</Text>
            <Text style={styles.infoValue}>{ride.distance || "N/A"}</Text>
            <Text style={styles.infoLabel}>Distance</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#fef3c7", "#fde68a"]}
            style={styles.infoItem}
          >
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoValue}>{ride.estimatedTime || "N/A"}</Text>
            <Text style={styles.infoLabel}>Duration</Text>
          </LinearGradient>

          <LinearGradient
            colors={["#d1fae5", "#a7f3d0"]}
            style={styles.infoItem}
          >
            <Text style={styles.infoIcon}>💵</Text>
            <Text style={styles.infoValue}>
              ${ride.estimatedFare || ride.fare}
            </Text>
            <Text style={styles.infoLabel}>Fare</Text>
          </LinearGradient>
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
    backgroundColor: theme.colors.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Status Header
  statusHeader: {
    padding: 24,
    paddingBottom: 20,
  },
  statusContent: {
    alignItems: "center",
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 8,
  },
  timerBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  fareHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  fareLabel: {
    fontSize: 18,
    color: "#374151",
  },
  fareAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1f2937",
  },

  // Live Stats Card
  liveStatsCard: {
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  liveStatItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: 12,
  },
  statIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  liveStatIcon: {
    fontSize: 24,
  },
  liveStatLabel: {
    fontSize: 11,
    color: "#065f46",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  liveStatValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#065f46",
  },
  liveStatDivider: {
    width: 2,
    height: 50,
    backgroundColor: "#a7f3d0",
    marginHorizontal: 12,
  },

  // Action Buttons
  primaryActionWrapper: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryActionButton: {
    padding: 18,
    alignItems: "center",
  },
  primaryActionText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
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
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: theme.colors.background.border,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cancelAction: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
  },
  cancelText: {
    color: "#dc2626",
  },

  // Section Containers
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: 16,
    letterSpacing: 1,
  },
  gradientBorder: {
    padding: 2,
    borderRadius: 16,
    background: "linear-gradient(135deg, #7c3aed, #f59e0b)",
  },

  // Cards
  compactCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.text.tertiary,
    letterSpacing: 1,
  },

  // Passenger Section
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  passengerDetails: {
    flex: 1,
  },
  passengerNameCompact: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  star: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
  },

  // Contact Section
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: 16,
  },
  contactSection: {
    gap: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  contactIcon: {
    fontSize: 18,
  },
  contactLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },
  contactValue: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: "600",
    flex: 1,
  },

  // Route Card
  routeCard: {
    padding: 20,
    borderRadius: 16,
  },
  routeContent: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
  },
  compactLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  pickupDotLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  destinationDotLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  dotText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 1,
  },
  compactLocationText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: "600",
    lineHeight: 20,
  },
  compactRouteLine: {
    width: 3,
    height: 20,
    backgroundColor: theme.colors.neutral[300],
    marginLeft: 19,
    marginVertical: 8,
    borderRadius: 2,
  },
  pickupDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    marginRight: 10,
  },
  destinationDotSmall: {
    width: 10,
    height: 10,
    borderRadius: 1,
    backgroundColor: "#EF4444",
    marginRight: 10,
  },

  // Info Grid
  infoGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  infoItem: {
    flex: 1,
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    gap: 8,
  },
  infoIcon: {
    fontSize: 28,
  },
  infoLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text.primary,
  },
});

export default RideDetailsScreen;
