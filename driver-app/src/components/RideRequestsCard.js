import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const RideRequestCard = ({
  passengerName = "John Doe",
  pickupLocation = "123 Main Street",
  destination = "456 Oak Avenue",
  estimatedFare = "$15.50",
  estimatedTime = "12 min",
  distance = "3.2 km",
  passengerRating = 4.8,
  onAccept,
  onDecline,
}) => {
  return (
    <View style={styles.container}>
      {/* Header with passenger info */}
      <View style={styles.header}>
        <View style={styles.passengerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {passengerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.passengerName}>{passengerName}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{passengerRating}</Text>
            </View>
          </View>
        </View>
        <View style={styles.fareContainer}>
          <Text style={styles.fare}>{estimatedFare}</Text>
          <Text style={styles.fareLabel}>Estimated</Text>
        </View>
      </View>

      {/* Trip details */}
      <View style={styles.tripDetails}>
        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <View style={styles.pickupDot} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Pickup</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {pickupLocation}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.locationRow}>
            <View style={styles.destinationDot} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Destination</Text>
              <Text style={styles.locationText} numberOfLines={1}>
                {destination}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tripStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{estimatedTime}</Text>
            <Text style={styles.statLabel}>Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distance}</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={onDecline}
          activeOpacity={0.8}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={onAccept}
          activeOpacity={0.9}
        >
          <Text style={styles.acceptText}>Accept Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
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
    backgroundColor: "#2d3748",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a202c",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    fontSize: 14,
    color: "#f59e0b",
    marginRight: 4,
  },
  rating: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  fareContainer: {
    alignItems: "flex-end",
  },
  fare: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1a202c",
    letterSpacing: -0.5,
  },
  fareLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  tripDetails: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10b981",
    marginRight: 12,
    marginTop: 6,
  },
  destinationDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: "#ef4444",
    marginRight: 12,
    marginTop: 6,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#e2e8f0",
    marginLeft: 5,
    marginVertical: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: "#1a202c",
    fontWeight: "400",
    lineHeight: 22,
  },
  tripStats: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a202c",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  declineButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  acceptButton: {
    backgroundColor: "#1a202c",
  },
  declineText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  acceptText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default RideRequestCard;
