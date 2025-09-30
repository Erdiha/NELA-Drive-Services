import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  Linking,
} from "react-native";

const { width, height } = Dimensions.get("window");

// Simple placeholder component since we don't have react-native-maps set up yet
const RideMapComponent = ({
  ride,
  driverLocation,
  showNavigation = true,
  onNavigatePress,
}) => {
  const openExternalNavigation = (destination) => {
    if (!destination) return;

    const { latitude, longitude } = destination;
    const label = destination.address || "Destination";

    Alert.alert("Open Navigation", "Choose your preferred navigation app:", [
      {
        text: "Google Maps",
        onPress: () => {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          Linking.openURL(url);
        },
      },
      {
        text: "Apple Maps",
        onPress: () => {
          const url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
          Linking.openURL(url);
        },
      },
      {
        text: "Waze",
        onPress: () => {
          const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
          Linking.openURL(url);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const getDestination = () => {
    if (ride.status === "accepted" || ride.status === "arrived") {
      return ride.pickup;
    }
    return ride.dropoff;
  };

  const getDestinationLabel = () => {
    if (ride.status === "accepted" || ride.status === "arrived") {
      return "Navigate to Pickup";
    }
    return "Navigate to Dropoff";
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>🗺️ Map View</Text>
        <Text style={styles.placeholderSubtext}>
          From: {ride.pickupLocation || ride.pickup?.address}
        </Text>
        <Text style={styles.placeholderSubtext}>
          To: {ride.destination || ride.dropoff?.address}
        </Text>
      </View>

      {/* Navigation Button */}
      {showNavigation && (
        <TouchableOpacity
          style={styles.navigationButton}
          onPress={() => {
            const destination = getDestination();
            if (onNavigatePress) {
              onNavigatePress(destination);
            } else {
              openExternalNavigation(destination);
            }
          }}
        >
          <Text style={styles.navigationButtonText}>
            🧭 {getDestinationLabel()}
          </Text>
        </TouchableOpacity>
      )}

      {/* Distance and ETA */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Distance</Text>
          <Text style={styles.infoValue}>{ride.distance || "N/A"}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>ETA</Text>
          <Text style={styles.infoValue}>{ride.estimatedTime || "N/A"}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    width: width - 32,
    height: 200,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 24,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginVertical: 2,
  },
  navigationButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  navigationButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 12,
    minWidth: 80,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
});

export default RideMapComponent;
