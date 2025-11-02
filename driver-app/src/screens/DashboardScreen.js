import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  Dimensions,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { PROVIDER_DEFAULT } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import StatsModal from "../components/StatsModal";

import theme from "../theme/theme";

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
} from "../store/store";
import RideRequestCard from "../components/RideRequestsCard";
import LocationService from "../services/locationService";
import NotificationService from "../services/notificationService";

const { width } = Dimensions.get("window");

export default function DashboardScreen({ navigation }) {
  const dispatch = useDispatch();
  const { newRides, activeRides, isOnline, driverLocation } = useSelector(
    (state) => state.rides
  );
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({ trips: 0, earnings: "0.00" });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  // Initialize services
  useEffect(() => {
    initializeServices();
  }, []);

  // Fetch location if not available
  useEffect(() => {
    if (!driverLocation) {
      LocationService.getCurrentLocation().then((location) => {
        if (location) {
          dispatch(setDriverLocation(location));
        }
      });
    }
  }, [driverLocation, dispatch]);

  // Pulse animation for online state
  useEffect(() => {
    if (isOnline) {
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

  // Online/offline subscription
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

  const initializeServices = async () => {
    setLoading(true);
    await NotificationService.initialize();
    const location = await LocationService.getCurrentLocation();
    if (location) {
      dispatch(setDriverLocation(location));
    }

    subscribeToActiveRides(getCurrentDriverId(), (rides) => {
      dispatch(setActiveRides(rides));
      setLoading(false);
    });

    await loadEarnings();
  };

  const loadEarnings = async () => {
    const todayEarnings = await calculateEarnings("today");
    setTodayStats({
      trips: todayEarnings.rideCount || 0,
      earnings: todayEarnings.totalEarnings || "0.00",
    });
  };

  const startLocationTracking = async () => {
    await LocationService.startLocationTracking((location) => {
      dispatch(setDriverLocation(location));
    });
  };

  const stopLocationTracking = () => {
    LocationService.stopLocationTracking();
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

  const handleRecenterMap = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location && mapRef.current) {
      dispatch(setDriverLocation(location));
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
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

  const mapRegion = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  // OFFLINE STATE
  if (!isOnline) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <MapView
          ref={mapRef}
          style={styles.backgroundMap}
          provider={PROVIDER_DEFAULT}
          showsUserLocation={true}
          showsMyLocationButton={false}
          zoomControlEnabled={false}
          region={mapRegion}
        />

        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.getCamera().then((camera) => {
                  camera.zoom += 1;
                  mapRef.current.animateCamera(camera);
                });
              }
            }}
          >
            <Text style={styles.zoomText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.zoomButton}
            onPress={() => {
              if (mapRef.current) {
                mapRef.current.getCamera().then((camera) => {
                  camera.zoom -= 1;
                  mapRef.current.animateCamera(camera);
                });
              }
            }}
          >
            <Text style={styles.zoomText}>−</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.locationButtonBottom}
          onPress={handleRecenterMap}
        >
          <MaterialIcons name="my-location" size={20} color="#4285F4" />
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.floatingGoOnlineButton}
          onPress={handleGoOnline}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={theme.gradients.primary.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goOnlineGradient}
          >
            <Text style={styles.goOnlineText}>Go Online</Text>
          </LinearGradient>
        </TouchableOpacity> */}
      </View>
    );
  }

  // ONLINE STATE
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <MapView
        ref={mapRef}
        style={styles.backgroundMap}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={true}
        showsMyLocationButton={false}
        zoomControlEnabled={false}
        region={mapRegion}
      />

      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            if (mapRef.current) {
              mapRef.current.getCamera().then((camera) => {
                camera.zoom += 1;
                mapRef.current.animateCamera(camera);
              });
            }
          }}
        >
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={() => {
            if (mapRef.current) {
              mapRef.current.getCamera().then((camera) => {
                camera.zoom -= 1;
                mapRef.current.animateCamera(camera);
              });
            }
          }}
        >
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.locationButtonBottom}
        onPress={handleRecenterMap}
      >
        <MaterialIcons name="my-location" size={20} color="#4285F4" />
      </TouchableOpacity>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.onlinePill}
          onPress={() => setShowStatsModal(true)}
          activeOpacity={0.7}
        >
          <View style={styles.greenDot} />
          <Text style={styles.onlinePillText}>Online</Text>
        </TouchableOpacity>

        <View style={styles.statsPill}>
          <Text style={styles.statsPillText}>
            ${todayStats.earnings} • {todayStats.trips}
          </Text>
        </View>
      </View>
      <StatsModal
        visible={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        todayStats={todayStats}
        activeRides={activeRides.length}
        onGoOffline={() => dispatch(setOnlineStatus(false))}
      />
      {newRides.length > 0 && (
        <View style={styles.floatingRidesContainer}>
          <FlatList
            data={newRides}
            renderItem={renderRideRequest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.floatingRidesList}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },

  backgroundMap: {
    ...StyleSheet.absoluteFillObject,
  },

  locationIcon: {
    fontSize: 24,
  },
  zoomControls: {
    position: "absolute",
    bottom: 30,
    left: 20,
  },

  zoomButton: {
    width: 44,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    ...theme.shadows.md,
  },

  zoomText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },

  locationButtonBottom: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.md,
  },

  topBar: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...theme.shadows.md,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 8,
  },

  onlinePillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },

  statsPill: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...theme.shadows.md,
  },

  statsPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },

  goOnlineGradient: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: "center",
  },

  goOnlineText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#ffffff",
  },

  onlineBarFixed: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
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

  floatingRidesContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    maxHeight: 300,
  },

  floatingRidesList: {
    gap: 12,
  },
});
