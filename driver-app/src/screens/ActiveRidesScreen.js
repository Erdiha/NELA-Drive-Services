import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { updateRideStatus } from "../services/rideService";
import {
  removeActiveRide,
  addCompletedRide,
  updateEarnings,
  updateRideStatus as updateLocalRideStatus,
} from "../store/store";
import LocationService from "../services/locationService";
import RideLocationUpdater from "../services/rideLocationUpdater"; // ✅ NEW

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

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "#3B82F6";
      case "arrived":
        return "#F59E0B";
      case "in_progress":
        return "#10B981";
      case "completed":
        return "#6B7280";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "accepted":
        return "Heading to pickup";
      case "arrived":
        return "Arrived at pickup";
      case "in_progress":
        return "Trip in progress";
      case "completed":
        return "Trip completed";
      default:
        return "Unknown status";
    }
  };

  const getNextAction = (status) => {
    switch (status) {
      case "accepted":
        return { text: "Arrived", nextStatus: "arrived" };
      case "arrived":
        return { text: "Start Trip", nextStatus: "in_progress" };
      case "in_progress":
        return { text: "Complete", nextStatus: "completed" };
      default:
        return null;
    }
  };

  const nextAction = getNextAction(ride.status);
  const statusColor = getStatusColor(ride.status);
  const statusText = getStatusText(ride.status);

  return (
    <View style={styles.rideCard}>
      <TouchableOpacity onPress={() => onViewDetails(ride)} activeOpacity={1}>
        {isScheduled ? (
          <View style={styles.scheduledBadge}>
            <Text style={styles.scheduledBadgeText}>
              {`Scheduled for ${scheduledTime.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}`}
            </Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{statusText}</Text>
          </View>
        )}

        {!isScheduled &&
        (ride.status === "accepted" || ride.status === "in_progress") &&
        liveETA ? (
          <View style={styles.liveStatsRow}>
            <View style={styles.liveStatMini}>
              <Text style={styles.liveStatText}>{`${liveDistance} mi`}</Text>
            </View>
            <View style={styles.liveStatMini}>
              <Text style={styles.liveStatText}>{`${liveETA} min`}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.passengerSection}>
          <View style={styles.passengerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(ride.passengerName || "A").charAt(0).toUpperCase()}
              </Text>
            </View>
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
            {`${ride.estimatedFare || ride.fare || 0}`}
          </Text>
        </View>

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

      <View style={styles.actionSection}>
        <View style={styles.actionButtonRow}>
          {!isScheduled && nextAction ? (
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: statusColor,
                  flex: 2,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                if (nextAction.nextStatus === "completed") {
                  onCompleteRide(ride);
                } else {
                  onUpdateStatus(ride.id, nextAction.nextStatus);
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.actionButtonText}>{nextAction.text}</Text>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              {
                flex: nextAction ? 1 : 1,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            onPress={() => {
              onCancelRide(ride);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>

        {isScheduled ? (
          <View style={styles.scheduledInfo}>
            <Text style={styles.scheduledInfoText}>
              {`Pickup time: ${scheduledTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default function ActiveRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { activeRides, driverLocation } = useSelector((state) => state.rides);

  const sortedRides = [...activeRides].sort((a, b) => {
    const aScheduled =
      a.scheduledDateTime && new Date(a.scheduledDateTime) > new Date();
    const bScheduled =
      b.scheduledDateTime && new Date(b.scheduledDateTime) > new Date();

    if (aScheduled && !bScheduled) return -1;
    if (!aScheduled && bScheduled) return 1;

    if (aScheduled && bScheduled) {
      return new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime);
    }

    const statusOrder = { in_progress: 1, arrived: 2, accepted: 3 };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  // ✅ FIXED: Manage location updates - use useMemo for stable dependency
  const activeRideStates = React.useMemo(() => {
    return activeRides
      .map((r) => `${r.id}:${r.status}`)
      .sort()
      .join(",");
  }, [activeRides]);

  useEffect(() => {
    console.log(`🔄 Checking location updates for ${activeRides.length} rides`);

    // Get rides that need updates
    const ridesNeedingUpdates = activeRides.filter((ride) =>
      ["accepted", "arrived", "in_progress"].includes(ride.status)
    );

    // Start updates ONLY if not already running
    ridesNeedingUpdates.forEach((ride) => {
      if (!RideLocationUpdater.isUpdating(ride.id)) {
        console.log(`▶️ Starting updates for ${ride.id}`);
        RideLocationUpdater.startUpdating(ride.id, ride.status);
      }
    });

    // Don't cleanup on every render - handled in status change handlers
  }, [activeRideStates]);

  const handleUpdateStatus = async (rideId, newStatus) => {
    try {
      await updateRideStatus(rideId, newStatus);
      dispatch(updateLocalRideStatus({ rideId, status: newStatus }));

      // ✅ NEW: Manage location updates based on status
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

              // ✅ NEW: Stop location updates
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
              console.log("🚫 Cancelling ride:", ride.id);

              // ✅ NEW: Stop location updates FIRST
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
              console.error("❌ Unexpected error cancelling ride:", error);
              dispatch(removeActiveRide(ride.id));
              Alert.alert("Ride Removed", "Removed from your active rides.");
            }
          },
        },
      ]
    );
  };

  const renderActiveRide = ({ item }) => {
    return (
      <RideStatusCard
        ride={item}
        onUpdateStatus={handleUpdateStatus}
        onCompleteRide={handleCompleteRide}
        onViewDetails={handleViewDetails}
        onCancelRide={handleCancelRide}
        driverLocation={driverLocation}
      />
    );
  };

  if (activeRides.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Active Rides</Text>
        <Text style={styles.emptySubtext}>
          Accept a ride request to see it here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedRides}
        renderItem={renderActiveRide}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  rideCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
  },
  statusBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scheduledBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#7c3aed",
    alignItems: "center",
  },
  scheduledBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  scheduledInfo: {
    backgroundColor: "#f5f3ff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  scheduledInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7c3aed",
  },
  liveStatsRow: {
    flexDirection: "row",
    backgroundColor: "#f0fdf4",
    padding: 12,
    justifyContent: "space-around",
  },
  liveStatMini: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
  },
  liveStatText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#166534",
  },
  passengerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: "700",
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 10,
  },
  destinationDot: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#EF4444",
    marginRight: 10,
  },
  ratingStar: {
    fontSize: 14,
    marginRight: 4,
  },
  routeLine: {
    width: 1,
    height: 12,
    backgroundColor: "#e5e7eb",
    marginLeft: 3,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 13,
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
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc2626",
  },
});
