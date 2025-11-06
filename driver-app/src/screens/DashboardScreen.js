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
import MapView, { PROVIDER_DEFAULT, Marker } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import StatsModal from "../components/StatsModal";
import MapViewDirections from "react-native-maps-directions";
import theme from "../theme/theme";
import DriverStatusControl from "../components/DriverStatusControl";
import GoingOnlineTransition from "../components/GoingOnlineTransition";
import OfflineControls from "../components/OfflineControls";
import { Vibration } from "react-native";

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
  setIncomingRideRequest,
  clearIncomingRideRequest,
} from "../store/store";
import RideRequestCard from "../components/RideRequestsCard";
import LocationService from "../services/locationService";
import NotificationService from "../services/notificationService";

const { width } = Dimensions.get("window");

const GOOGLE_MAPS_APIKEY = "AIzaSyAFhis3Ivs_yx5gi-Elk4Rt0Apr9LSBxfQ";

export default function DashboardScreen({ navigation, incomingRide }) {
  const dispatch = useDispatch();
  const {
    newRides,
    activeRides,
    isOnline,
    driverLocation,
    incomingRideRequest,
  } = useSelector((state) => state.rides);
  const [loading, setLoading] = useState(false);
  const [todayStats, setTodayStats] = useState({ trips: 0, earnings: "0.00" });
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showGoingOnlineTransition, setShowGoingOnlineTransition] =
    useState(false);

  const [showQuickActions, setShowQuickActions] = useState(false);

  const [goingOnline, setGoingOnline] = useState(false);

  useEffect(() => {
    // Reset on mount
    setShowQuickActions(false);

    return () => {
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    initializeServices();
  }, []);

  useEffect(() => {
    if (!driverLocation) {
      LocationService.getCurrentLocation().then((location) => {
        if (location) {
          dispatch(setDriverLocation(location));
        }
      });
    }
  }, [driverLocation, dispatch]);

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

  useEffect(() => {
    let unsubscribe;

    if (isOnline) {
      unsubscribe = subscribeToNewRides((rides) => {
        dispatch(setNewRides(rides));
        // Only set if there's a new ride and no current incoming ride
        if (rides.length > 0 && !incomingRideRequest) {
          dispatch(setIncomingRideRequest(rides[0]));
        } else if (rides.length === 0) {
          dispatch(clearIncomingRideRequest());
        }
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

  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    const allRides = [...newRides, ...activeRides];
    if (allRides.length === 0) return;

    const coordinates = [
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      },
    ];

    allRides.forEach((ride) => {
      if (ride.pickup?.latitude) {
        coordinates.push({
          latitude: ride.pickup.latitude,
          longitude: ride.pickup.longitude,
        });
      }
      if (ride.dropoff?.latitude) {
        coordinates.push({
          latitude: ride.dropoff.latitude,
          longitude: ride.dropoff.longitude,
        });
      }
    });

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 80,
          bottom: 420, // Extra space for bottom sheet when incoming ride
          left: 80,
        },
        animated: true,
      });
    }, 500);
  }, [newRides, activeRides, driverLocation]);

  // Fit map when incoming ride appears
  useEffect(() => {
    if (!mapRef.current || !driverLocation) return;

    // Get incoming ride from Redux
    const incomingRide =
      incomingRideRequest || (newRides.length > 0 ? newRides[0] : null);
    if (!incomingRide) return;

    const coordinates = [
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      },
    ];

    if (incomingRide.pickup?.latitude) {
      coordinates.push({
        latitude: incomingRide.pickup.latitude,
        longitude: incomingRide.pickup.longitude,
      });
    }

    if (incomingRide.dropoff?.latitude) {
      coordinates.push({
        latitude: incomingRide.dropoff.latitude,
        longitude: incomingRide.dropoff.longitude,
      });
    }

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 80,
          right: 60,
          bottom: 450, // Account for bottom sheet at 50% height
          left: 60,
        },
        animated: true,
      });
    }, 300);
  }, [incomingRideRequest, newRides, driverLocation]);

  // Handle incoming ride - fit map to show route
  useEffect(() => {
    if (!incomingRide || !mapRef.current || !driverLocation) return;

    const coordinates = [
      {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
      },
    ];

    // Add pickup location
    if (incomingRide.pickup?.latitude) {
      coordinates.push({
        latitude: incomingRide.pickup.latitude,
        longitude: incomingRide.pickup.longitude,
      });
    }

    // Add dropoff location
    if (incomingRide.dropoff?.latitude) {
      coordinates.push({
        latitude: incomingRide.dropoff.latitude,
        longitude: incomingRide.dropoff.longitude,
      });
    }

    // Fit map to show all points with padding for bottom sheet
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 400, // Extra padding for expanded bottom sheet
          left: 50,
        },
        animated: true,
      });
    }, 300);
  }, [incomingRide, driverLocation]);

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
      setGoingOnline(true);

      const location = await LocationService.getCurrentLocation();
      if (!location) {
        Alert.alert(
          "Location Required",
          "Please enable location services to go online."
        );
        setGoingOnline(false);
        return;
      }

      // Vibration
      Vibration.vibrate([0, 100, 50, 100]);

      // Delay for effect
      setTimeout(() => {
        setGoingOnline(false);
        dispatch(setOnlineStatus(true));
        NotificationService.sendRideUpdateNotification(
          "You're Online",
          "Ready to accept ride requests"
        );
      }, 1000);
    } catch (error) {
      console.log("Error going online:", error);
      setGoingOnline(false);
      Alert.alert("Error", "Failed to go online. Please try again.");
    }
  };

  const completeGoingOnline = () => {
    setShowGoingOnlineTransition(false);
    dispatch(setOnlineStatus(true));
    NotificationService.sendRideUpdateNotification(
      "You're Online",
      "Ready to accept ride requests"
    );
  };

  const handleRecenterMap = async () => {
    const location = await LocationService.getCurrentLocation();
    if (location && mapRef.current) {
      dispatch(setDriverLocation(location));
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0122,
        longitudeDelta: 0.012,
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
      onAccept={() => {
        dispatch(setIncomingRideRequest(item));
      }}
      onDecline={() => handleDeclineRide(item)}
    />
  );

  const customMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#fffbeb" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#78716c" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#ffffff" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#fef9c3" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#ecfccb" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#fde68a" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#fcd34d" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#fef08a" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#facc15" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#e0f2fe" }],
    },
  ];

  const mapRegion = driverLocation
    ? {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      };

  // OFFLINE STATE
  if (!isOnline) {
    return (
      <>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <MapView
            ref={mapRef}
            style={styles.backgroundMap}
            provider={PROVIDER_DEFAULT}
            customMapStyle={customMapStyle}
            showsUserLocation={true}
            showsMyLocationButton={false}
            zoomControlEnabled={false}
            region={mapRegion}
          >
            {newRides.map((ride) => (
              <React.Fragment key={`new-${ride.id}`}>
                <Marker
                  coordinate={{
                    latitude: ride.pickup.latitude,
                    longitude: ride.pickup.longitude,
                  }}
                  title="New Ride - Pickup"
                  description={ride.pickup.address}
                  pinColor="green"
                />
                <Marker
                  coordinate={{
                    latitude: ride.dropoff.latitude,
                    longitude: ride.dropoff.longitude,
                  }}
                  title="New Ride - Dropoff"
                  description={ride.dropoff.address}
                  pinColor="red"
                />
                <MapViewDirections
                  origin={{
                    latitude: ride.pickup.latitude,
                    longitude: ride.pickup.longitude,
                  }}
                  destination={{
                    latitude: ride.dropoff.latitude,
                    longitude: ride.dropoff.longitude,
                  }}
                  apikey={GOOGLE_MAPS_APIKEY}
                  strokeWidth={3}
                  strokeColor="#8b5cf6"
                  lineDashPattern={[10, 5]}
                  lineCap="round"
                  lineJoin="round"
                />
              </React.Fragment>
            ))}

            {activeRides.map((ride) => (
              <React.Fragment key={`active-${ride.id}`}>
                <Marker
                  coordinate={{
                    latitude: ride.pickup.latitude,
                    longitude: ride.pickup.longitude,
                  }}
                  title="Active Pickup"
                  description={ride.pickup.address}
                  pinColor="#fbbf24"
                />
                <Marker
                  coordinate={{
                    latitude: ride.dropoff.latitude,
                    longitude: ride.dropoff.longitude,
                  }}
                  title="Active Dropoff"
                  description={ride.dropoff.address}
                  pinColor="#f97316"
                />
                <MapViewDirections
                  origin={{
                    latitude: ride.pickup.latitude,
                    longitude: ride.pickup.longitude,
                  }}
                  destination={{
                    latitude: ride.dropoff.latitude,
                    longitude: ride.dropoff.longitude,
                  }}
                  apikey={GOOGLE_MAPS_APIKEY}
                  strokeWidth={6}
                  strokeColor="#ec4899"
                />
              </React.Fragment>
            ))}
          </MapView>

          <View style={[styles.zoomControls, styles.zoomControlsOffline]}>
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
            style={[styles.locationButtonBottom, styles.locationButtonOffline]}
            onPress={handleRecenterMap}
          >
            <MaterialIcons name="my-location" size={20} color="#4285F4" />
          </TouchableOpacity>

          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.goOnlineButtonContainer}
              onPress={handleGoOnline}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.goOnlineGradient}
              >
                <View style={styles.buttonContent}>
                  {goingOnline ? (
                    <>
                      <MaterialIcons
                        name="hourglass-empty"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.goOnlineText}>Going Online...</Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons
                        name="power"
                        size={20}
                        color="white"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.goOnlineText}>Go Online</Text>
                      <Text style={styles.goOnlineSubtext}>
                        Start accepting rides
                      </Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionsIcon}
              onPress={() => setShowQuickActions(true)}
            >
              <MaterialIcons name="more-horiz" size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        {!isOnline && showQuickActions && (
          <View style={styles.persistentControls}>
            <OfflineControls
              navigation={navigation}
              currentRoute="Dashboard"
              onClose={() => setShowQuickActions(false)}
            />
          </View>
        )}
      </>
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
        customMapStyle={customMapStyle}
        showsUserLocation={true}
        showsMyLocationButton={false}
        zoomControlEnabled={false}
        region={mapRegion}
      >
        {newRides.map((ride) => (
          <React.Fragment key={`new-${ride.id}`}>
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="New Ride - Pickup"
              description={ride.pickup.address}
              pinColor="green"
            />
            <Marker
              coordinate={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              title="New Ride - Dropoff"
              description={ride.dropoff.address}
              pinColor="red"
            />
            <MapViewDirections
              origin={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              destination={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={3}
              strokeColor="#8b5cf6"
              lineDashPattern={[10, 5]}
              lineCap="round"
              lineJoin="round"
            />
          </React.Fragment>
        ))}

        {activeRides.map((ride) => (
          <React.Fragment key={`active-${ride.id}`}>
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="Active Pickup"
              description={ride.pickup.address}
              pinColor="#fbbf24"
            />
            <Marker
              coordinate={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              title="Active Dropoff"
              description={ride.dropoff.address}
              pinColor="#f97316"
            />
            <MapViewDirections
              origin={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              destination={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              apikey={GOOGLE_MAPS_APIKEY}
              strokeWidth={6}
              strokeColor="#ec4899"
            />
          </React.Fragment>
        ))}
      </MapView>

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
      {showGoingOnlineTransition && (
        <View
          style={{
            position: "absolute",
            top: 100,
            left: 50,
            right: 50,
            height: 100,
            backgroundColor: "red",
            zIndex: 1000,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", marginTop: 40 }}>
            TRANSITION TEST
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  persistentControls: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  zoomControlsOffline: {
    bottom: 150, // Lower position when offline
  },
  locationButtonOffline: {
    bottom: 150, // Lower position when offline
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
  },
  goOnlineButtonContainer: {
    flex: 3,
    borderRadius: 12,
    overflow: "hidden",
  },
  quickActionsIcon: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.md,
  },
  buttonContent: {
    alignItems: "center",
  },
  buttonIcon: {
    marginBottom: 4,
  },
  goOnlineSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  backgroundMap: {
    ...StyleSheet.absoluteFillObject,
  },
  zoomControls: {
    position: "absolute",
    bottom: 200,
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
    bottom: 200,
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
    width: 10,
    height: 10,
    borderRadius: 8,
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
  floatingRidesContainer: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
    maxHeight: 300,
  },
  floatingRidesList: {
    gap: 12,
  },
  floatingGoOnlineButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 9999,
    elevation: 20,
    ...theme.shadows.xl,
  },
  goOnlineGradient: {
    paddingVertical: 18,
    alignItems: "center",
  },
  goOnlineText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
});
