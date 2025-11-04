// src/components/CustomBottomSheet.js
import React, { useMemo, useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Keyboard,
  Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector, useDispatch, shallowEqual } from "react-redux";

// Reanimated v3
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  useDerivedValue,
} from "react-native-reanimated";
import {
  setOnlineStatus,
  setIncomingRideRequest,
  clearIncomingRideRequest,
  setNewRides,
} from "../store/store";
import { updateRideStatus, getCurrentDriverId } from "../services/rideService";

import SoundService from "../services/soundService";

// Gesture Handler v2
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const { height } = Dimensions.get("window");

// Motion config (snappy, Uber/Lyft-like)
const SPRING_CONFIG = { damping: 22, stiffness: 450, mass: 0.5 };
const TIMING_CONFIG = { duration: 180 };

// Snap sensitivity
const PULL_RATIO = 0.12; // ~12% pull to commit up/down
const FULL_PULL_RATIO = 0.55;
const VELOCITY_THRESHOLD = 120;
const STRONG_UP_FLICK = 800;

const CustomBottomSheet = ({ navigation }) => {
  const dispatch = useDispatch();

  // Shared values (never declare inside JSX)
  const translateY = useSharedValue(height); // start off-screen
  const backdropOpacity = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const dragStartY = useSharedValue(0);

  // Local state
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [backdropTouchable, setBackdropTouchable] = useState(false);
  const [rideTimer, setRideTimer] = useState(12); // 12 seconds

  // Named JS helpers for runOnJS
  const setSnapIndexJS = (i) => setCurrentSnapIndex(i);
  const setBackdropTouchableJS = (v) => setBackdropTouchable(v);

  const {
    isOnline,
    activeRides,
    todayEarnings,
    todayTrips,
    incomingRideRequest,
    newRides,
  } = useSelector((state) => {
    const rides = state.rides || {};
    const completedRides = rides.completedRides || [];
    const today = new Date().toDateString();

    const tripsToday = completedRides.filter(
      (r) => r?.completedAt && new Date(r.completedAt).toDateString() === today
    ).length;

    const earningsToday = completedRides
      .filter(
        (r) =>
          r?.completedAt && new Date(r.completedAt).toDateString() === today
      )
      .reduce((sum, r) => sum + parseFloat(r.estimatedFare || r.fare || 0), 0)
      .toFixed(2);

    return {
      isOnline: rides.isOnline || false,
      activeRides: rides.activeRides || [],
      todayEarnings: rides.earnings?.today || earningsToday || "0.00",
      todayTrips: tripsToday,
      incomingRideRequest: rides.incomingRideRequest || null,
      newRides: rides.newRides || [],
    };
  }, shallowEqual);

  const currentRide = activeRides.length > 0 ? activeRides[0] : null;
  const shouldShowSheet = isOnline || !!currentRide;

  // Check if we have an incoming ride (either test or real)
  const hasIncomingRide = incomingRideRequest || newRides.length > 0;

  const snapPoints = useMemo(() => {
    const screenHeight = height - keyboardHeight;
    if (hasIncomingRide) {
      // Incoming ride request - 45% of screen for middle
      return [
        screenHeight - 150, // Collapsed - just header visible
        screenHeight - screenHeight * 0.45, // Middle - 45% of screen
        0, // Full screen
      ];
    }

    if (currentRide) {
      const collapsed = screenHeight - 280;
      const mid = screenHeight - 650;
      const full = 0;
      return [collapsed, mid, full];
    }

    if (isOnline) {
      const collapsed = screenHeight - 240;
      const mid = screenHeight - 600;
      const full = 0;
      return [collapsed, mid, full];
    }

    return [screenHeight - 120, screenHeight - 350];
  }, [currentRide, isOnline, keyboardHeight, hasIncomingRide]);

  // Timer effect - 12 seconds countdown
  useEffect(() => {
    if (!hasIncomingRide) {
      setRideTimer(12); // Reset when no incoming ride
      return;
    }

    setRideTimer(12); // Set initial timer

    const interval = setInterval(() => {
      setRideTimer((prev) => {
        if (prev <= 1) {
          // Auto-decline when timer reaches 0
          dispatch(clearIncomingRideRequest());

          // Cancel real ride if exists
          if (newRides.length > 0) {
            const rideToCancel = newRides[0];
            updateRideStatus(rideToCancel.id, "cancelled", {
              cancelledBy: getCurrentDriverId(),
              cancelledAt: new Date(),
              cancelReason: "Auto-declined - driver timeout",
            })
              .then(() => {
                dispatch(setNewRides([]));
                console.log("✅ Ride auto-cancelled due to timeout");
              })
              .catch((error) => {
                console.error("❌ Error auto-cancelling ride:", error);
              });
          }

          return 12;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasIncomingRide, dispatch]);

  // Keyboard listeners (iOS + Android)
  useEffect(() => {
    const s1 = Keyboard.addListener("keyboardWillShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const s2 = Keyboard.addListener("keyboardWillHide", () =>
      setKeyboardHeight(0)
    );
    const s3 = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight((k) => k || e.endCoordinates.height)
    );
    const s4 = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0)
    );
    return () => {
      s1.remove();
      s2.remove();
      s3.remove();
      s4.remove();
    };
  }, []);

  useEffect(() => {
    if (!shouldShowSheet) {
      translateY.value = withTiming(height, TIMING_CONFIG);
      backdropOpacity.value = withTiming(0, TIMING_CONFIG);
      setCurrentSnapIndex(0);
      return;
    }

    // Start at middle position for incoming rides, collapsed for others
    const initialIndex = hasIncomingRide ? 1 : 0;
    translateY.value = withSpring(snapPoints[initialIndex], SPRING_CONFIG);
    backdropOpacity.value = withTiming(
      hasIncomingRide ? 0.5 : 0,
      TIMING_CONFIG
    );
    setCurrentSnapIndex(initialIndex);
  }, [
    shouldShowSheet,
    snapPoints,
    translateY,
    backdropOpacity,
    hasIncomingRide,
  ]);

  // 12-second vibration + sound for incoming rides
  useEffect(() => {
    if (hasIncomingRide) {
      // Continuous vibration for 12 seconds
      const vibrationPattern = [
        0, 500, 300, 500, 300, 500, 300, 500, 300, 500, 300, 500, 300, 500,
      ];
      Vibration.vibrate(vibrationPattern, true); // repeat = true for continuous

      // Play sound
      SoundService.playRideRequestSound();

      // Stop after 12 seconds
      const timeout = setTimeout(() => {
        Vibration.cancel();
        SoundService.stopRideRequestSound();
      }, 12000);

      return () => {
        clearTimeout(timeout);
        Vibration.cancel();
        SoundService.stopRideRequestSound();
      };
    }
  }, [hasIncomingRide]);

  // Backdrop touchability derived on UI thread
  useDerivedValue(() => {
    runOnJS(setBackdropTouchableJS)(backdropOpacity.value > 0.02);
  });

  // Decide snap target (12% rule + velocity)
  const snapToPoint = useCallback(
    (velocityY = 0) => {
      "worklet";
      if (!snapPoints.length) return;

      const curY = translateY.value;
      const baseY = snapPoints[currentSnapIndex];

      const upIndex = Math.max(0, currentSnapIndex - 1);
      const downIndex = Math.min(snapPoints.length - 1, currentSnapIndex + 1);

      const upY = snapPoints[upIndex];
      const downY = snapPoints[downIndex];

      const upBoundary = baseY - (baseY - upY) * PULL_RATIO;
      const downBoundary = baseY + (downY - baseY) * PULL_RATIO;

      let targetIndex = currentSnapIndex;
      if (Math.abs(velocityY) > VELOCITY_THRESHOLD) {
        // Pull up (negative velocity) → open further (higher index)
        targetIndex = velocityY < 0 ? downIndex : upIndex;
      } else {
        // Normal drag thresholds
        if (curY <= upBoundary) targetIndex = downIndex; // pulled up
        else if (curY >= downBoundary) targetIndex = upIndex; // pulled down
      }

      const targetY = snapPoints[targetIndex];
      translateY.value = withSpring(targetY, SPRING_CONFIG);

      const minY = snapPoints[snapPoints.length - 1]; // most open
      const maxY = snapPoints[0]; // collapsed
      const nextOpacity = interpolate(
        targetY,
        [maxY, minY],
        [0, 0.5],
        Extrapolation.CLAMP
      );
      backdropOpacity.value = withTiming(nextOpacity, TIMING_CONFIG);

      runOnJS(setSnapIndexJS)(targetIndex);
    },
    [snapPoints, backdropOpacity, translateY, currentSnapIndex]
  );

  // Pan gesture: follow finger from actual drag start
  const panGesture = Gesture.Pan()
    .activeOffsetY([-6, 6]) // react sooner
    .enabled(!!shouldShowSheet)
    .onStart(() => {
      "worklet";
      isGestureActive.value = true;
      dragStartY.value = translateY.value; // anchor to true current Y
    })
    .onUpdate((event) => {
      "worklet";
      const minY = snapPoints[snapPoints.length - 1];
      const maxY = snapPoints[0] + 40; // small overscroll window
      const next = dragStartY.value + event.translationY;
      translateY.value = Math.max(minY, Math.min(maxY, next));

      // live backdrop update
      const op = interpolate(
        translateY.value,
        [maxY, minY],
        [0, 0.5],
        Extrapolation.CLAMP
      );
      backdropOpacity.value = op;
    })
    .onEnd((event) => {
      "worklet";
      isGestureActive.value = false;
      snapToPoint(event.velocityY);
    });

  // Tap backdrop to collapse to first snap
  const tapGesture = Gesture.Tap().onEnd(() => {
    "worklet";
    if (currentSnapIndex > 0) {
      translateY.value = withSpring(snapPoints[0], SPRING_CONFIG);
      backdropOpacity.value = withTiming(0, TIMING_CONFIG);
      runOnJS(setSnapIndexJS)(0);
    }
  });

  // Animated styles
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scaleX: withTiming(isGestureActive.value ? 1.15 : 1, {
          duration: 120,
        }),
      },
    ],
  }));

  // Actions (JS only)
  const handleGoOnline = useCallback(
    () => dispatch(setOnlineStatus(true)),
    [dispatch]
  );
  const handleGoOffline = useCallback(
    () => dispatch(setOnlineStatus(false)),
    [dispatch]
  );

  // Content renderers
  const renderOfflineContent = useCallback(
    () => (
      <View style={styles.contentContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${todayEarnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayTrips}</Text>
            <Text style={styles.statLabel}>Trips Completed</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.primaryButtonWrapper}
          onPress={handleGoOnline}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#7c3aed", "#f59e0b"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>⚡ Go Online</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.quickLinksRow}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate("Earnings")}
          >
            <Text style={styles.quickLinkIcon}>💰</Text>
            <Text style={styles.quickLinkText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => navigation.navigate("Settings")}
          >
            <Text style={styles.quickLinkIcon}>⚙️</Text>
            <Text style={styles.quickLinkText}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLink}>
            <Text style={styles.quickLinkIcon}>❓</Text>
            <Text style={styles.quickLinkText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [todayEarnings, todayTrips, navigation, handleGoOnline]
  );

  const renderOnlineContent = useCallback(
    () => (
      <View style={styles.contentContainer}>
        <View style={styles.onlineHeader}>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineStatusText}>Looking for rides...</Text>
          </View>
          <View style={styles.earningsBadge}>
            <Text style={styles.earningsText}>${todayEarnings}</Text>
          </View>
          {/* <TouchableOpacity
            style={{ backgroundColor: "red", padding: 10, margin: 10 }}
            onPress={() =>
              dispatch(
                setIncomingRideRequest({
                  passengerName: "John Doe",
                  passengerRating: 4.8,
                  distance: "2.3 mi",
                  estimatedFare: "12.50",
                })
              )
            }
          >
            <Text style={{ color: "white" }}>TEST: Simulate Incoming Ride</Text>
          </TouchableOpacity> */}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("ActiveRides")}
          >
            <Text style={styles.actionIcon}>🚗</Text>
            <Text style={styles.actionText}>Active Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Preferences</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.offlineButton]}
            onPress={handleGoOffline}
          >
            <Text style={styles.actionIcon}>⏸️</Text>
            <Text style={[styles.actionText, styles.offlineText]}>
              Go Offline
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.onlineStatsRow}>
          <View style={styles.onlineStat}>
            <Text style={styles.onlineStatValue}>{todayTrips}</Text>
            <Text style={styles.onlineStatLabel}>Trips Today</Text>
          </View>
          <View style={styles.onlineStat}>
            <Text style={styles.onlineStatValue}>{activeRides.length}</Text>
            <Text style={styles.onlineStatLabel}>Active</Text>
          </View>
        </View>
      </View>
    ),
    [
      todayEarnings,
      todayTrips,
      activeRides.length,
      navigation,
      handleGoOffline,
      dispatch,
    ]
  );

  const renderActiveRideContent = useCallback(() => {
    const r = currentRide;
    if (!r) return null;
    return (
      <View style={styles.contentContainer}>
        <LinearGradient
          colors={["#7c3aed", "#f59e0b"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rideStatusBadge}
        >
          <Text style={styles.rideStatusText}>
            {r.status === "accepted" && "🚗 Heading to Pickup"}
            {r.status === "arrived" && "📍 Arrived at Pickup"}
            {r.status === "in_progress" && "🛣️ Trip in Progress"}
          </Text>
        </LinearGradient>

        <View style={styles.passengerCard}>
          <View style={styles.passengerRow}>
            <LinearGradient
              colors={["#7c3aed", "#f59e0b"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.passengerAvatar}
            >
              <Text style={styles.avatarText}>
                {(r.passengerName || "A").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <View style={styles.passengerInfo}>
              <Text style={styles.passengerName}>
                {r.passengerName || "Anonymous"}
              </Text>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingStar}>⭐</Text>
                <Text style={styles.ratingText}>
                  {r.passengerRating?.toFixed(1) || "New"}
                </Text>
              </View>
            </View>
            <Text style={styles.fareAmount}>${r.estimatedFare || r.fare}</Text>
          </View>
        </View>

        <View style={styles.rideActionsRow}>
          <TouchableOpacity
            style={styles.rideQuickAction}
            onPress={() => navigation.navigate("RideDetails", { rideId: r.id })}
          >
            <Text style={styles.rideQuickIcon}>🗺️</Text>
            <Text style={styles.rideQuickText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rideQuickAction}>
            <Text style={styles.rideQuickIcon}>📞</Text>
            <Text style={styles.rideQuickText}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rideQuickAction}>
            <Text style={styles.rideQuickIcon}>💬</Text>
            <Text style={styles.rideQuickText}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rideQuickAction, styles.viewDetailsAction]}
            onPress={() => navigation.navigate("RideDetails", { rideId: r.id })}
          >
            <Text style={styles.rideQuickIcon}>👁️</Text>
            <Text style={styles.rideQuickText}>Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [currentRide, navigation]);

  const renderIncomingRideContent = useCallback(() => {
    const ride =
      incomingRideRequest || (newRides.length > 0 ? newRides[0] : null);
    if (!ride) return null;

    return (
      <View style={styles.contentContainer}>
        {/* Compact Header */}
        <LinearGradient
          colors={["#7c3aed", "#f59e0b"]}
          style={styles.compactHeader}
        >
          <Text style={styles.compactHeaderTitle}>New Ride Request</Text>
          <Text style={styles.compactTimer}>{rideTimer}s</Text>
        </LinearGradient>

        {/* Compact Ride Info Card */}
        <View style={styles.compactRideCard}>
          <View style={styles.compactTopRow}>
            <LinearGradient
              colors={["#7c3aed", "#f59e0b"]}
              style={styles.compactAvatar}
            >
              <Text style={styles.compactAvatarText}>
                {(ride.passengerName || "A").charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>

            <View style={styles.compactInfo}>
              <Text style={styles.compactName}>
                {ride.passengerName || "Anonymous"}
              </Text>
              <Text style={styles.compactRating}>
                ⭐ {ride.passengerRating || "New"}
              </Text>
            </View>

            <View style={styles.compactFare}>
              <Text style={styles.compactFareValue}>
                ${ride.estimatedFare || ride.fare}
              </Text>
              <Text style={styles.compactDistance}>
                {ride.distance || "2.3 mi"}
              </Text>
            </View>
          </View>

          {/* Compact Route */}
          <View style={styles.compactRoute}>
            <View style={styles.compactPickup}>
              <View style={styles.compactPickupDot} />
              <Text style={styles.compactLocationText} numberOfLines={1}>
                {ride.pickupLocation || ride.pickup?.address || "123 Main St"}
              </Text>
            </View>
            <View style={styles.compactDropoff}>
              <View style={styles.compactDropoffDot} />
              <Text style={styles.compactLocationText} numberOfLines={1}>
                {ride.destination || ride.dropoff?.address || "456 Oak Ave"}
              </Text>
            </View>
          </View>
        </View>

        {/* Compact Action Buttons */}
        <View style={styles.compactActionButtons}>
          <TouchableOpacity
            style={styles.compactDeclineButton}
            onPress={async () => {
              console.log("Decline button pressed");
              Vibration.cancel();
              SoundService.stopRideRequestSound();

              // Clear from Redux immediately for UI
              dispatch(clearIncomingRideRequest());

              // If it's a real ride, cancel it in the backend
              if (newRides.length > 0) {
                const rideToCancel = newRides[0];
                try {
                  console.log("Cancelling real ride:", rideToCancel.id);

                  // Cancel the ride in backend (since you're the only driver)
                  await updateRideStatus(rideToCancel.id, "cancelled", {
                    cancelledBy: getCurrentDriverId(),
                    cancelledAt: new Date(),
                    cancelReason: "Driver declined - no available drivers",
                  });

                  // Remove from local newRides
                  dispatch(setNewRides([]));

                  console.log("✅ Ride cancelled successfully");
                } catch (error) {
                  console.error("❌ Error cancelling ride:", error);
                }
              }
            }}
          >
            <Text style={styles.compactDeclineText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.compactAcceptWrapper}
            onPress={() => {
              console.log("Accept button pressed");
              Vibration.cancel();
              SoundService.stopRideRequestSound();
              dispatch(clearIncomingRideRequest());
              // Add accept logic here
            }}
          >
            <LinearGradient
              colors={["#7c3aed", "#f59e0b"]}
              style={styles.compactAcceptButton}
            >
              <Text style={styles.compactAcceptText}>Accept</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [incomingRideRequest, newRides, rideTimer, dispatch]);

  const renderContent = useCallback(() => {
    if (hasIncomingRide) return renderIncomingRideContent();
    if (currentRide) return renderActiveRideContent();
    if (isOnline) return renderOnlineContent();
    return renderOfflineContent();
  }, [
    hasIncomingRide,
    currentRide,
    isOnline,
    renderIncomingRideContent,
    renderActiveRideContent,
    renderOnlineContent,
    renderOfflineContent,
  ]);

  if (!shouldShowSheet) return null;

  return (
    <>
      {/* Backdrop */}
      <GestureDetector gesture={tapGesture}>
        <Animated.View
          style={[styles.backdrop, backdropAnimatedStyle]}
          pointerEvents={backdropTouchable ? "auto" : "none"}
        />
      </GestureDetector>

      {/* Bottom Sheet */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, sheetAnimatedStyle]}>
          <View style={styles.handleContainer}>
            <Animated.View style={[styles.handle, handleAnimatedStyle]} />
          </View>
          <View style={styles.contentWrapper}>{renderContent()}</View>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 998,
  },
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    height,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handleContainer: { alignItems: "center", paddingVertical: 12 },
  handle: { width: 40, height: 4, backgroundColor: "#D1D5DB", borderRadius: 2 },
  contentWrapper: { flex: 1 },
  contentContainer: { padding: 20, paddingTop: 8 },

  // OFFLINE STYLES
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingVertical: 12,
  },
  statItem: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  statDivider: { width: 1, height: 40, backgroundColor: "#e5e7eb" },
  primaryButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  primaryButton: { paddingVertical: 16, alignItems: "center" },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  quickLinksRow: { flexDirection: "row", justifyContent: "space-around" },
  quickLink: { alignItems: "center", flex: 1 },
  quickLinkIcon: { fontSize: 24, marginBottom: 4 },
  quickLinkText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },

  // ONLINE STYLES
  onlineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    marginRight: 10,
  },
  onlineStatusText: { fontSize: 16, fontWeight: "700", color: "#1f2937" },
  earningsBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  earningsText: { fontSize: 16, fontWeight: "800", color: "#10B981" },
  actionsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  actionButton: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  offlineButton: { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { fontSize: 11, fontWeight: "700", color: "#374151" },
  offlineText: { color: "#dc2626" },
  onlineStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  onlineStat: { alignItems: "center" },
  onlineStatValue: { fontSize: 28, fontWeight: "800", color: "#1f2937" },
  onlineStatLabel: { fontSize: 12, color: "#6b7280", fontWeight: "600" },

  // ACTIVE RIDE STYLES
  rideStatusBadge: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  rideStatusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  passengerCard: {
    backgroundColor: "#fafafa",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  passengerRow: { flexDirection: "row", alignItems: "center" },
  passengerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  passengerInfo: { flex: 1 },
  passengerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingStar: { fontSize: 14, marginRight: 4 },
  ratingText: { fontSize: 13, color: "#6b7280", fontWeight: "600" },
  fareAmount: { fontSize: 20, fontWeight: "800", color: "#10B981" },
  rideActionsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  rideQuickAction: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  viewDetailsAction: { backgroundColor: "#faf5ff", borderColor: "#c4b5fd" },
  rideQuickIcon: { fontSize: 20, marginBottom: 2 },
  rideQuickText: { fontSize: 10, fontWeight: "700", color: "#374151" },

  // COMPACT INCOMING RIDE STYLES
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  compactHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  compactTimer: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  compactRideCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  compactTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  compactAvatarText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#ffffff",
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  compactRating: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  compactFare: {
    alignItems: "flex-end",
  },
  compactFareValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#059669",
    marginBottom: 2,
  },
  compactDistance: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  compactRoute: {
    gap: 6,
  },
  compactPickup: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactDropoff: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactPickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 8,
  },
  compactDropoffDot: {
    width: 8,
    height: 8,
    borderRadius: 1,
    backgroundColor: "#ef4444",
    marginRight: 8,
  },
  compactLocationText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  compactActionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  compactDeclineButton: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#ef4444",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  compactDeclineText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ef4444",
  },
  compactAcceptWrapper: {
    flex: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  compactAcceptButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  compactAcceptText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
});

export default CustomBottomSheet;
