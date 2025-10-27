import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const theme = {
  colors: {
    primary: { main: "#7c3aed" },
    status: { success: "#10b981" },
    background: { card: "#ffffff", border: "#e4e4e7" },
    text: { primary: "#18181b", secondary: "#3f3f46", tertiary: "#71717a" },
    neutral: { 100: "#f4f4f5", 200: "#e4e4e7" },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  layout: { borderRadius: { md: 8, lg: 12 } },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  },
};

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
      {/* Passenger & Fare Row */}
      <View style={styles.topRow}>
        <View style={styles.passengerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {passengerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.passengerDetails}>
            <Text style={styles.passengerName}>{passengerName}</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.rating}>{passengerRating}</Text>
            </View>
          </View>
        </View>

        <View style={styles.fareContainer}>
          <Text style={styles.fare}>{estimatedFare}</Text>
        </View>
      </View>

      {/* Trip Details */}
      <View style={styles.tripSection}>
        {/* Pickup */}
        <View style={styles.locationRow}>
          <View style={styles.pickupDot} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {pickupLocation}
            </Text>
          </View>
        </View>

        <View style={styles.routeLine} />

        {/* Destination */}
        <View style={styles.locationRow}>
          <View style={styles.destinationDot} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Dropoff</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {destination}
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>⏱</Text>
          <Text style={styles.statText}>{estimatedTime}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statIcon}>📍</Text>
          <Text style={styles.statText}>{distance}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={onDecline}
          activeOpacity={0.7}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptText}>Accept Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.background.border,
    ...theme.shadows.sm,
  },

  // Top Row - Passenger & Fare
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },

  passengerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.main,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
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
    fontSize: 17,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 2,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  star: {
    fontSize: 13,
    color: "#f59e0b",
    marginRight: 4,
  },

  rating: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },

  fareContainer: {
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.md,
  },

  fare: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.status.success,
  },

  // Trip Section
  tripSection: {
    marginBottom: theme.spacing.lg,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.status.success,
    marginRight: theme.spacing.md,
    marginTop: 6,
  },

  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#ef4444",
    marginRight: theme.spacing.md,
    marginTop: 6,
  },

  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: theme.colors.neutral[200],
    marginLeft: 4,
    marginVertical: theme.spacing.xs,
  },

  locationTextContainer: {
    flex: 1,
  },

  locationLabel: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
    fontWeight: "500",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  locationText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: "400",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },

  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  statDivider: {
    width: 1,
    backgroundColor: theme.colors.neutral[200],
  },

  statIcon: {
    fontSize: 16,
  },

  statText: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },

  // Action Buttons
  actions: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },

  declineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.layout.borderRadius.md,
    alignItems: "center",
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  declineText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },

  acceptButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: theme.layout.borderRadius.md,
    alignItems: "center",
    backgroundColor: theme.colors.primary.main,
  },

  acceptText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});

export default RideRequestCard;
