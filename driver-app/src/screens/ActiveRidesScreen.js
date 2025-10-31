import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../theme/theme";
import { updateRideStatus } from "../services/rideService";
import {
  removeActiveRide,
  addCompletedRide,
  updateEarnings,
  updateRideStatus as updateLocalRideStatus,
} from "../store/store";
import LocationService from "../services/locationService";
import RideLocationUpdater from "../services/rideLocationUpdater";

const RideStatusCard = ({
  ride,
  onUpdateStatus,
  onCompleteRide,
  onViewDetails,
  onCancelRide,
  driverLocation,
}) => {
  if (!ride || !ride.id) {
    return null;
  }

  const [liveETA, setLiveETA] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);

  const isScheduled =
    ride.scheduledDateTime && new Date(ride.scheduledDateTime) > new Date();
  const scheduledTime = ride.scheduledDateTime
    ? new Date(ride.scheduledDateTime)
    : null;

  useEffect(() => {
    if (!driverLocation || !ride || isScheduled) return;

    const updateLiveStats = () => {
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
        setLiveDistance(distanceMiles);

        const eta = Math.round((parseFloat(distanceMiles) / 25) * 60);
        setLiveETA(eta);
      }
    };

    updateLiveStats();
    const interval = setInterval(updateLiveStats, 15000);
    return () => clearInterval(interval);
  }, [ride, driverLocation, isScheduled]);

  const getStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "🚗 Heading to Pickup";
      case "arrived":
        return "📍 Arrived at Pickup";
      case "in_progress":
        return "🛣️ Trip in Progress";
      default:
        return "Unknown";
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case "accepted":
        return { text: "✓ Arrived", nextStatus: "arrived" };
      case "arrived":
        return { text: "▶ Start Trip", nextStatus: "in_progress" };
      case "in_progress":
        return { text: "🏁 Complete", nextStatus: "completed" };
      default:
        return null;
    }
  };

  const nextAction = getNextAction(ride.status);
  const statusText = getStatusText(ride.status);

  return (
    <View style={styles.rideCard}>
      <TouchableOpacity
        onPress={() => onViewDetails(ride)}
        activeOpacity={0.95}
      >
        {/* Status Header with Gradient */}
        {isScheduled ? (
          <LinearGradient
            colors={theme.gradients.primary.colors}
            start={theme.gradients.primary.start}
            end={theme.gradients.primary.end}
            style={styles.scheduledBadge}
          >
            <Text style={styles.scheduledBadgeText}>
              📅{" "}
              {scheduledTime.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={theme.gradients.primary.colors}
            start={theme.gradients.primary.start}
            end={theme.gradients.primary.end}
            style={styles.statusBadge}
          >
            <Text style={styles.statusBadgeText}>{statusText}</Text>
          </LinearGradient>
        )}

        {/* Live Stats (ETA & Distance) */}
        {!isScheduled &&
        (ride.status === "accepted" || ride.status === "in_progress") &&
        liveETA ? (
          <View style={styles.liveStatsRow}>
            <View style={styles.liveStatMini}>
              <Text style={styles.liveStatIcon}>📍</Text>
              <Text style={styles.liveStatText}>{liveDistance} mi</Text>
            </View>
            <View style={styles.liveStatMini}>
              <Text style={styles.liveStatIcon}>⏱</Text>
              <Text style={styles.liveStatText}>{liveETA} min</Text>
            </View>
          </View>
        ) : null}

        {/* Passenger Section */}
        <View style={styles.passengerSection}>
          <View style={styles.passengerInfo}>
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
              <Text style={styles.passengerName}>
                {ride.passengerName || "Anonymous"}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.rating}>
                  {ride.passengerRating
                    ? ride.passengerRating.toFixed(1)
                    : "New"}
                </Text>
              </View>
            </View>
          </View>
          <Text style={styles.fare}>
            ${ride.estimatedFare || ride.fare || 0}
          </Text>
        </View>

        {/* Route Section */}
        <View style={styles.routeSection}>
          <View style={styles.routeRow}>
            <View style={styles.pickupDot} />
            <Text style={styles.routeText} numberOfLines={1}>
              {ride.pickupLocation || ride.pickup?.address || "Pickup location"}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={styles.destinationDot} />
            <Text style={styles.routeText} numberOfLines={1}>
              {ride.destination || ride.dropoff?.address || "Destination"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <View style={styles.actionButtonRow}>
          {!isScheduled && nextAction ? (
            <>
              <TouchableOpacity
                style={styles.actionButtonWrapper}
                onPress={() => {
                  if (nextAction.nextStatus === "completed") {
                    onCompleteRide(ride);
                  } else {
                    onUpdateStatus(ride.id, nextAction.nextStatus);
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={theme.gradients.primary.colors}
                  start={theme.gradients.primary.start}
                  end={theme.gradients.primary.end}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>{nextAction.text}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => onCancelRide(ride)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>✕</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.cancelButtonFull}
              onPress={() => onCancelRide(ride)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default function ActiveRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { activeRides, driverLocation } = useSelector((state) => state.rides);

  // Separate scheduled and immediate rides
  const scheduledRides = activeRides
    .filter(
      (ride) =>
        ride.scheduledDateTime && new Date(ride.scheduledDateTime) > new Date()
    )
    .sort(
      (a, b) => new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime)
    );

  const immediateRides = activeRides
    .filter(
      (ride) =>
        !ride.scheduledDateTime ||
        new Date(ride.scheduledDateTime) <= new Date()
    )
    .sort((a, b) => {
      const statusOrder = { in_progress: 1, arrived: 2, accepted: 3 };
      return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
    });

  const activeRideStates = React.useMemo(() => {
    return activeRides
      .map((r) => `${r.id}:${r.status}`)
      .sort()
      .join(",");
  }, [activeRides]);

  useEffect(() => {
    const ridesNeedingUpdates = activeRides.filter((ride) =>
      ["accepted", "arrived", "in_progress"].includes(ride.status)
    );

    ridesNeedingUpdates.forEach((ride) => {
      if (!RideLocationUpdater.isUpdating(ride.id)) {
        RideLocationUpdater.startUpdating(ride.id, ride.status);
      }
    });
  }, [activeRideStates]);

  const handleUpdateStatus = async (rideId, newStatus) => {
    try {
      await updateRideStatus(rideId, newStatus);
      dispatch(updateLocalRideStatus({ rideId, status: newStatus }));

      if (["accepted", "arrived", "in_progress"].includes(newStatus)) {
        RideLocationUpdater.startUpdating(rideId, newStatus);
      } else if (newStatus === "completed" || newStatus === "cancelled") {
        RideLocationUpdater.stopUpdating(rideId);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update ride status");
      console.error("Error updating ride status:", error);
    }
  };

  const handleViewDetails = (ride) => {
    navigation.navigate("RideDetails", { rideId: ride.id });
  };

  const handleCompleteRide = async (ride) => {
    Alert.alert(
      "Complete Trip",
      `Confirm completion of trip to ${ride.destination}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          onPress: async () => {
            try {
              await updateRideStatus(ride.id, "completed", {
                completedAt: new Date(),
                finalFare: ride.estimatedFare || ride.fare,
              });

              RideLocationUpdater.stopUpdating(ride.id);

              dispatch(addCompletedRide({ ...ride, status: "completed" }));
              dispatch(removeActiveRide(ride.id));

              const fareAmount = parseFloat(
                ride.estimatedFare || ride.fare || 0
              );
              dispatch(updateEarnings({ today: fareAmount }));

              Alert.alert("Trip Completed!", `You earned $${fareAmount}`);
            } catch (error) {
              Alert.alert("Error", "Failed to complete trip");
              console.error("Error completing trip:", error);
            }
          },
        },
      ]
    );
  };

  const handleCancelRide = async (ride) => {
    Alert.alert(
      "Cancel Ride?",
      `Are you sure you want to cancel this ride to ${
        ride.destination || "destination"
      }?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              RideLocationUpdater.stopUpdating(ride.id);

              const result = await updateRideStatus(ride.id, "cancelled", {
                cancelledBy: "driver",
                cancelledAt: new Date(),
                cancelReason: "Cancelled by driver",
              });

              dispatch(removeActiveRide(ride.id));

              if (result && result.success === false) {
                if (result.code === "not-found") {
                  Alert.alert(
                    "Ride Removed",
                    "This ride was already cancelled or deleted."
                  );
                } else {
                  Alert.alert(
                    "Ride Removed",
                    "Removed from your list. There may have been an issue updating the server."
                  );
                }
              } else {
                Alert.alert(
                  "Ride Cancelled",
                  "The ride has been cancelled and the customer has been notified."
                );
              }
            } catch (error) {
              console.error("Unexpected error cancelling ride:", error);
              dispatch(removeActiveRide(ride.id));
              Alert.alert("Ride Removed", "Removed from your active rides.");
            }
          },
        },
      ]
    );
  };

  if (activeRides.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🚗</Text>
        </View>
        <Text style={styles.emptyTitle}>No Active Rides</Text>
        <Text style={styles.emptySubtext}>
          Accept a ride request to see it here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Immediate Rides Section */}
        {immediateRides.length > 0 && (
          <View style={styles.section}>
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={theme.gradients.primary.start}
              end={theme.gradients.primary.end}
              style={styles.sectionHeader}
            >
              <Text style={styles.sectionTitle}>🔥 Active Now</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{immediateRides.length}</Text>
              </View>
            </LinearGradient>

            {immediateRides.map((ride) => (
              <RideStatusCard
                key={ride.id}
                ride={ride}
                onUpdateStatus={handleUpdateStatus}
                onCompleteRide={handleCompleteRide}
                onViewDetails={handleViewDetails}
                onCancelRide={handleCancelRide}
                driverLocation={driverLocation}
              />
            ))}
          </View>
        )}

        {/* Scheduled Rides Section */}
        {scheduledRides.length > 0 && (
          <View style={styles.section}>
            <LinearGradient
              colors={["#f0f9ff", "#e0f2fe"]}
              style={styles.sectionHeaderScheduled}
            >
              <Text style={styles.sectionTitleScheduled}>
                📅 Scheduled Rides
              </Text>
              <View style={styles.badgeScheduled}>
                <Text style={styles.badgeTextScheduled}>
                  {scheduledRides.length}
                </Text>
              </View>
            </LinearGradient>

            {scheduledRides.map((ride) => (
              <RideStatusCard
                key={ride.id}
                ride={ride}
                onUpdateStatus={handleUpdateStatus}
                onCompleteRide={handleCompleteRide}
                onViewDetails={handleViewDetails}
                onCancelRide={handleCancelRide}
                driverLocation={driverLocation}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  sectionHeaderScheduled: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#7c3aed",
  },
  sectionTitleScheduled: {
    fontSize: 18,
    fontWeight: "800",
    color: "#7c3aed",
  },
  badgeScheduled: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 32,
    alignItems: "center",
  },
  badgeTextScheduled: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  rideCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.background.border,
  },
  statusBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  scheduledBadge: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  scheduledBadgeText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  liveStatsRow: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    padding: 12,
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#d1fae5",
  },
  liveStatMini: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  liveStatIcon: {
    fontSize: 16,
  },
  liveStatText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065f46",
  },
  passengerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fafafa",
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  passengerDetails: {
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  fare: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10B981",
  },
  routeSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 3,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    marginRight: 10,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 1,
    backgroundColor: "#EF4444",
    marginRight: 10,
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: "#e5e7eb",
    marginLeft: 4,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
  actionSection: {
    padding: 16,
    paddingTop: 8,
  },
  actionButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButtonWrapper: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  actionButton: {
    paddingVertical: 18,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButton: {
    width: 60,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#fca5a5",
  },
  cancelButtonFull: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#fca5a5",
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#dc2626",
  },
});
