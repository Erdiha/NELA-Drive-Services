import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// Theme imports
import theme from "../theme/theme";

// Service imports
import {
  subscribeToNewRides,
  subscribeToActiveRides,
  updateRideStatus,
  setDriverOnlineStatus,
  getCurrentDriverId,
  calculateEarnings,
} from "../services/rideService";
import {
  setNewRides,
  setOnlineStatus,
  setActiveRides,
  setDriverLocation,
  updateEarnings,
} from "../store/store";
import RideRequestCard from "../components/RideRequestsCard";
import LocationService from "../services/locationService";
import NotificationService from "../services/notificationService";

const { width } = Dimensions.get("window");

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { newRides, activeRides, isOnline, earnings } = useSelector(
    (state) => state.rides
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [locationWatcher, setLocationWatcher] = useState(null);
  const [todayStats, setTodayStats] = useState({ trips: 0, earnings: "0.00" });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    initializeServices();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isOnline) {
      // Pulse animation for online state
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  const initializeServices = async () => {
    setLoading(true);
    await NotificationService.initialize();
    const location = await LocationService.getCurrentLocation();
    if (location) {
      dispatch(setDriverLocation(location));
    }

    // Subscribe to active rides
    const activeRidesUnsubscribe = subscribeToActiveRides(
      getCurrentDriverId(),
      (rides) => {
        dispatch(setActiveRides(rides));
        setLoading(false);
      }
    );

    // Load today's earnings
    await loadEarnings();

    return activeRidesUnsubscribe;
  };

  const loadEarnings = async () => {
    const todayEarnings = await calculateEarnings("today");
    setTodayStats({
      trips: todayEarnings.rideCount || 0,
      earnings: todayEarnings.totalEarnings || "0.00",
    });
  };

  useEffect(() => {
    let unsubscribe;

    if (isOnline) {
      unsubscribe = subscribeToNewRides((rides) => {
        dispatch(setNewRides(rides));
      });
      startLocationTracking();
      setDriverOnlineStatus(true);
    } else {
      dispatch(setNewRides([]));
      stopLocationTracking();
      setDriverOnlineStatus(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isOnline, dispatch]);

  const startLocationTracking = async () => {
    const watcher = await LocationService.startLocationTracking((location) => {
      dispatch(setDriverLocation(location));
    });
    setLocationWatcher(watcher);
  };

  const stopLocationTracking = () => {
    if (locationWatcher) {
      LocationService.stopLocationTracking();
      setLocationWatcher(null);
    }
  };

  const handleGoOnline = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      if (!location) {
        Alert.alert(
          "Location Required",
          "Please enable location services to go online."
        );
        return;
      }
      dispatch(setOnlineStatus(true));
      NotificationService.sendRideUpdateNotification(
        "You're Online",
        "Ready to accept ride requests"
      );
    } catch (error) {
      Alert.alert("Error", "Failed to go online. Please try again.");
    }
  };

  const handleGoOffline = () => {
    Alert.alert(
      "Go Offline?",
      "You won't receive any ride requests while offline.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Offline",
          style: "destructive",
          onPress: () => {
            dispatch(setOnlineStatus(false));
            NotificationService.sendRideUpdateNotification(
              "You're Offline",
              "You won't receive ride requests"
            );
          },
        },
      ]
    );
  };

  const handleAcceptRide = async (ride) => {
    try {
      const savedProfile = await AsyncStorage.getItem("driverProfile");
      const driverProfile = savedProfile ? JSON.parse(savedProfile) : null;
      const currentLocation = await LocationService.getCurrentLocation();

      const driverInfo = {
        driverId: getCurrentDriverId(),
        driverName: driverProfile?.name || "Erdi Haciogullari",
        driverPhone: driverProfile?.phone || "",
        driverPhotoURL:
          driverProfile?.photoURL || "https://i.imgur.com/uYhkACU.jpeg",
        driverVehicle: driverProfile?.vehicle || {
          make: "Toyota",
          model: "RAV4 Prime",
          year: "2024",
          color: "White with Black Trim",
          licensePlate: "9LXJ115",
        },
        driver: {
          id: getCurrentDriverId(),
          name: driverProfile?.name || "Erdi Haciogullari",
          phone: driverProfile?.phone || "",
          photoURL:
            driverProfile?.photoURL || "https://i.imgur.com/uYhkACU.jpeg",
          vehicle: driverProfile?.vehicle || {
            make: "Toyota",
            model: "RAV4 Prime",
            year: "2024",
            color: "White with Black Trim",
            licensePlate: "9LXJ115",
          },
        },
        acceptedAt: new Date(),
        driverLocation: currentLocation,
      };

      await updateRideStatus(ride.id, "accepted", driverInfo);

      // Navigate to Active Rides
      navigation.navigate("ActiveRides");

      NotificationService.sendRideUpdateNotification(
        "Ride Accepted",
        `Pickup at ${ride.pickupLocation || ride.pickup?.address}`
      );
    } catch (error) {
      Alert.alert("Error", "Failed to accept ride. Please try again.");
      console.error("Error accepting ride:", error);
    }
  };

  const handleDeclineRide = async (ride) => {
    try {
      await updateRideStatus(ride.id, "no_driver_available", {
        declinedBy: getCurrentDriverId(),
        declinedAt: new Date(),
      });

      const updatedRides = newRides.filter((r) => r.id !== ride.id);
      dispatch(setNewRides(updatedRides));
    } catch (error) {
      console.error("Error declining ride:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const renderRideRequest = ({ item }) => (
    <RideRequestCard
      passengerName={item.passengerName || "Rider"}
      pickupLocation={item.pickupLocation || item.pickup?.address}
      destination={item.destination || item.dropoff?.address}
      estimatedFare={`$${item.estimatedFare || item.fare}`}
      estimatedTime={item.estimatedTime || "Unknown"}
      distance={item.distance || "Unknown"}
      passengerRating={item.passengerRating || 5.0}
      onAccept={() => handleAcceptRide(item)}
      onDecline={() => handleDeclineRide(item)}
    />
  );

  // OFFLINE STATE
  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={styles.offlineContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.offlineHeader}>
            <Text style={styles.offlineTitle}>You're Offline</Text>
            <Text style={styles.offlineSubtitle}>
              Go online to start accepting rides
            </Text>
          </View>

          {/* Today's Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Today's Summary</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>${todayStats.earnings}</Text>
                <Text style={styles.summaryText}>Earnings</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{todayStats.trips}</Text>
                <Text style={styles.summaryText}>Trips</Text>
              </View>
            </View>
          </View>

          {/* Large Go Online Button */}
          <TouchableOpacity
            style={styles.goOnlineButton}
            onPress={handleGoOnline}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goOnlineGradient}
            >
              <View style={styles.goOnlineIcon}>
                <Text style={styles.goOnlineIconText}>⚡</Text>
              </View>
              <Text style={styles.goOnlineText}>Go Online</Text>
              <Text style={styles.goOnlineSubtext}>
                Start receiving ride requests
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Quick Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Quick Tips</Text>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                High demand areas: Downtown, Airport, Universities
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Peak hours: 7-9 AM, 5-8 PM weekdays
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>
                Maintain 4.8+ rating for best ride offers
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ONLINE STATE
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Online Status Bar */}
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.onlineBar}
        >
          <Animated.View
            style={[
              styles.onlineIndicator,
              { transform: [{ scale: pulseAnim }] },
            ]}
          />
          <Text style={styles.onlineBarText}>
            You're Online • Ready for rides
          </Text>
          <TouchableOpacity
            style={styles.offlineButton}
            onPress={handleGoOffline}
          >
            <Text style={styles.offlineButtonText}>Go Offline</Text>
          </TouchableOpacity>
        </LinearGradient>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>${todayStats.earnings}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{todayStats.trips}</Text>
            <Text style={styles.statLabel}>Trips Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activeRides.length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>

        {/* Ride Requests */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {newRides.length > 0 && (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>New Ride Requests</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{newRides.length}</Text>
              </View>
            </View>
          )}

          {loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Loading requests...</Text>
            </View>
          ) : newRides.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Text style={styles.emptyIcon}>🔍</Text>
              </View>
              <Text style={styles.emptyTitle}>Looking for rides...</Text>
              <Text style={styles.emptyText}>
                New ride requests will appear here.{"\n"}
                Make sure your location is accurate.
              </Text>
            </View>
          ) : (
            <FlatList
              data={newRides}
              renderItem={renderRideRequest}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  // ==================== OFFLINE STATE ====================
  offlineContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 40,
  },

  offlineHeader: {
    alignItems: "center",
    marginBottom: 32,
  },

  offlineTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: 8,
  },

  offlineSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },

  // Summary Card
  summaryCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    ...theme.shadows.lg,
  },

  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.secondary,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 36,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  summaryText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },

  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.neutral[200],
  },

  // Go Online Button
  goOnlineButton: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 24,
    ...theme.shadows.xl,
  },

  goOnlineGradient: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: "center",
  },

  goOnlineIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  goOnlineIconText: {
    fontSize: 40,
  },

  goOnlineText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
  },

  goOnlineSubtext: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },

  // Tips Card
  tipsCard: {
    backgroundColor: theme.colors.background.card,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.sm,
  },

  tipsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 16,
  },

  tipItem: {
    flexDirection: "row",
    marginBottom: 12,
  },

  tipBullet: {
    fontSize: 16,
    color: theme.colors.primary.main,
    marginRight: 12,
    fontWeight: "700",
  },

  tipText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },

  // ==================== ONLINE STATE ====================
  onlineBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },

  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffffff",
  },

  onlineBarText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  offlineButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    ...theme.shadows.md,
  },

  offlineButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primary.main,
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    backgroundColor: theme.colors.background.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    ...theme.shadows.md,
  },

  statCard: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },

  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: theme.colors.neutral[200],
  },

  // Ride Requests Section
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },

  badge: {
    backgroundColor: theme.colors.primary.main,
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

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 24,
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
    marginBottom: 12,
  },

  emptyText: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 24,
  },

  listContent: {
    gap: 12,
  },
});
