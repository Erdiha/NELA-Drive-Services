import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import SoundService from "../services/soundService";

const { width, height } = Dimensions.get("window");

const theme = {
  colors: {
    primary: { main: "#7c3aed" },
    status: { success: "#10b981" },
    background: { card: "#ffffff", border: "#e4e4e7" },
    text: { primary: "#18181b", secondary: "#3f3f46", tertiary: "#71717a" },
    neutral: { 100: "#f4f4f5", 200: "#e4e4e7" },
  },
  gradients: {
    primary: {
      colors: ["#7c3aed", "#f59e0b"], // Purple to Amber
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
    },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  layout: { borderRadius: { md: 8, lg: 12 } },
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
  // Animation values
  const slideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Play notification sound (bypasses silent mode) - LOOPS
    setTimeout(() => {
      SoundService.playRideRequestSound();
    }, 0);

    // Vibrate pattern: [delay, vibrate, pause, vibrate, pause, vibrate]
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);

    // Backdrop fade in
    Animated.timing(backdropAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Pulse animation (loops)
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow opacity animation (loops)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Cleanup: Stop sound when card is dismissed
  useEffect(() => {
    return () => {
      SoundService.stopRideRequestSound();
      console.log("🛑 Ride request card dismissed - sound stopped");
    };
  }, []);

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
      {/* Dark Backdrop Overlay */}
      <Animated.View
        style={[
          styles.modalBackdrop,
          {
            opacity: backdropAnim,
          },
        ]}
      >
        {/* Centered Card Container */}
        <View style={styles.modalContent}>
          <View style={styles.outerContainer}>
            {/* Glow Border Layer */}
            <Animated.View
              style={[
                styles.glowBorder,
                {
                  opacity: glowOpacity,
                },
              ]}
            />

            {/* Main Card with Transform Animations */}
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ translateY: slideAnim }, { scale: pulseAnim }],
                },
              ]}
            >
              {/* Gradient Header */}
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={theme.gradients.primary.start}
                end={theme.gradients.primary.end}
                style={styles.gradientHeader}
              >
                <View style={styles.headerContent}>
                  <View>
                    <Text style={styles.headerTitle}>🔔 NEW RIDE REQUEST</Text>
                    <Text style={styles.headerSubtitle}>
                      Tap to view details
                    </Text>
                  </View>
                  <View style={styles.fareContainer}>
                    <Text style={styles.fareAmount}>{estimatedFare}</Text>
                    <Text style={styles.fareCurrency}>USD</Text>
                  </View>
                </View>
              </LinearGradient>

              {/* Passenger Info */}
              <View style={styles.contentSection}>
                <View style={styles.passengerRow}>
                  <LinearGradient
                    colors={theme.gradients.primary.colors}
                    start={theme.gradients.primary.start}
                    end={theme.gradients.primary.end}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>
                      {passengerName.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{passengerName}</Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.star}>★</Text>
                      <Text style={styles.rating}>{passengerRating}</Text>
                    </View>
                  </View>
                </View>

                {/* Trip Details */}
                <View style={styles.tripSection}>
                  {/* Pickup */}
                  <View style={styles.locationRow}>
                    <View style={styles.pickupDot} />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationLabel}>PICKUP</Text>
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
                      <Text style={styles.locationLabel}>DROPOFF</Text>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {destination}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stats Row */}
                <LinearGradient
                  colors={["#f8f9fa", "#ffffff"]}
                  style={styles.statsRow}
                >
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>⏱</Text>
                    <Text style={styles.statText}>{estimatedTime}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>📍</Text>
                    <Text style={styles.statText}>{distance}</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => {
                    SoundService.stopRideRequestSound();
                    onDecline();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.acceptButtonWrapper}
                  onPress={() => {
                    SoundService.stopRideRequestSound();
                    onAccept();
                  }}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={theme.gradients.primary.colors}
                    start={theme.gradients.primary.start}
                    end={theme.gradients.primary.end}
                    style={styles.acceptButton}
                  >
                    <Text style={styles.acceptText}>✓ Accept Ride</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)", // Dark overlay
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalContent: {
    width: "100%",
    maxWidth: 500,
  },

  outerContainer: {
    position: "relative",
  },

  glowBorder: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: theme.layout.borderRadius.lg + 3,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#f59e0b",
  },

  container: {
    backgroundColor: theme.colors.background.card,
    borderRadius: theme.layout.borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Gradient Header
  gradientHeader: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },

  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.85)",
  },

  fareContainer: {
    alignItems: "flex-end",
  },

  fareAmount: {
    fontSize: 32,
    fontWeight: "900",
    color: "#ffffff",
    lineHeight: 32,
  },

  fareCurrency: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },

  // Content Section
  contentSection: {
    padding: 20,
  },

  // Passenger Row
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  avatarText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "700",
  },

  passengerInfo: {
    flex: 1,
  },

  passengerName: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  star: {
    fontSize: 16,
    color: "#f59e0b",
    marginRight: 4,
  },

  rating: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },

  // Trip Section
  tripSection: {
    marginBottom: 16,
    backgroundColor: "#fafafa",
    padding: 16,
    borderRadius: 10,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.status.success,
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
    backgroundColor: theme.colors.neutral[200],
    marginLeft: 5,
    marginVertical: 4,
  },

  locationTextContainer: {
    flex: 1,
  },

  locationLabel: {
    fontSize: 10,
    color: theme.colors.text.tertiary,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.8,
  },

  locationText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: "500",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    borderRadius: theme.layout.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },

  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  statDivider: {
    width: 1,
    backgroundColor: theme.colors.neutral[200],
  },

  statIcon: {
    fontSize: 18,
  },

  statText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },

  // Action Buttons
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  declineButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: theme.layout.borderRadius.md,
    alignItems: "center",
    backgroundColor: theme.colors.neutral[100],
    borderWidth: 2,
    borderColor: theme.colors.neutral[200],
  },

  declineText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text.secondary,
  },

  acceptButtonWrapper: {
    flex: 2,
    borderRadius: theme.layout.borderRadius.md,
    overflow: "hidden",
  },

  acceptButton: {
    paddingVertical: 16,
    alignItems: "center",
  },

  acceptText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
});

export default RideRequestCard;
