import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
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

const RideStatusCard = ({
  ride,
  onUpdateStatus,
  onCompleteRide,
  onViewDetails,
  driverLocation,
}) => {
  const [liveETA, setLiveETA] = useState(null);
  const [liveDistance, setLiveDistance] = useState(null);

  // Check if ride is scheduled for future
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

  return (
    <TouchableOpacity
      style={styles.rideCard}
      onPress={() => onViewDetails(ride)}
      activeOpacity={0.7}
    >
      {/* Scheduled Badge */}
      {isScheduled ? (
        <View style={styles.scheduledBadge}>
          <Text style={styles.scheduledBadgeText}>
            📅 Scheduled for{" "}
            {scheduledTime.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(ride.status) },
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {getStatusText(ride.status)}
          </Text>
        </View>
      )}

      {/* Live Stats - Prominent (only for active, not scheduled) */}
      {!isScheduled &&
        (ride.status === "accepted" || ride.status === "in_progress") &&
        liveETA && (
          <View style={styles.liveStatsRow}>
            <View style={styles.liveStatMini}>
              <Text style={styles.liveStatIcon}>📍</Text>
              <Text style={styles.liveStatText}>{liveDistance} mi</Text>
            </View>
            <View style={styles.liveStatMini}>
              <Text style={styles.liveStatIcon}>⏱️</Text>
              <Text style={styles.liveStatText}>{liveETA} min</Text>
            </View>
          </View>
        )}

      {/* Passenger & Fare */}
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
              <Text style={styles.star}>⭐</Text>
              <Text style={styles.rating}>{ride.passengerRating || 5.0}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.fare}>${ride.estimatedFare || ride.fare}</Text>
      </View>

      {/* Route - Compact */}
      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <View style={styles.pickupDot} />
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.pickupLocation || ride.pickup?.address}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeRow}>
          <View style={styles.destinationDot} />
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.destination || ride.dropoff?.address}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {!isScheduled && nextAction && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: getStatusColor(ride.status) },
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (nextAction.nextStatus === "completed") {
                onCompleteRide(ride);
              } else {
                onUpdateStatus(ride.id, nextAction.nextStatus);
              }
            }}
          >
            <Text style={styles.actionButtonText}>{nextAction.text}</Text>
          </TouchableOpacity>
        )}
        {isScheduled && (
          <View style={styles.scheduledInfo}>
            <Text style={styles.scheduledInfoText}>
              Pickup time:{" "}
              {scheduledTime.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function ActiveRidesScreen({ navigation }) {
  const dispatch = useDispatch();
  const { activeRides, driverLocation } = useSelector((state) => state.rides);

  // Sort rides: scheduled rides first (by time), then active rides (by status)
  const sortedRides = [...activeRides].sort((a, b) => {
    const aScheduled =
      a.scheduledDateTime && new Date(a.scheduledDateTime) > new Date();
    const bScheduled =
      b.scheduledDateTime && new Date(b.scheduledDateTime) > new Date();

    // Scheduled rides come first
    if (aScheduled && !bScheduled) return -1;
    if (!aScheduled && bScheduled) return 1;

    // If both scheduled, sort by time
    if (aScheduled && bScheduled) {
      return new Date(a.scheduledDateTime) - new Date(b.scheduledDateTime);
    }

    // Active rides sorted by status priority
    const statusOrder = { in_progress: 1, arrived: 2, accepted: 3 };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  const handleUpdateStatus = async (rideId, newStatus) => {
    try {
      await updateRideStatus(rideId, newStatus);
      dispatch(updateLocalRideStatus({ rideId, status: newStatus }));
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

  const renderActiveRide = ({ item }) => (
    <RideStatusCard
      ride={item}
      onUpdateStatus={handleUpdateStatus}
      onCompleteRide={handleCompleteRide}
      onViewDetails={handleViewDetails}
      driverLocation={driverLocation}
    />
  );

  if (activeRides.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚗</Text>
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
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
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
    justifyContent: "center",
    gap: 24,
  },
  liveStatMini: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveStatIcon: {
    fontSize: 16,
    marginRight: 6,
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
  star: {
    fontSize: 12,
    marginRight: 4,
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
});
