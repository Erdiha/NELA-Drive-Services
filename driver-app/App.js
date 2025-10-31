import React, { useRef, useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Vibration,
  Modal,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store, setOnlineStatus } from "./src/store/store";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Import theme
import theme from "./src/theme/theme";
import { createPulse, fadeIn, fadeOut } from "./src/theme/animations";

// Import services
import SoundService from "./src/services/soundService";
import LocationService from "./src/services/locationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import DashboardScreen from "./src/screens/DashboardScreen";
import ActiveRidesScreen from "./src/screens/ActiveRidesScreen";
import EarningsScreen from "./src/screens/EarningsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import RideDetailsScreen from "./src/screens/RideDetailsScreen";

import ReviewService from "./src/services/reviewService";
import { setDriverRating } from "./src/store/store";
import { getCurrentDriverId } from "./src/services/rideService";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const { width, height } = Dimensions.get("window");

// Simple Icon Component
const Icon = ({ name, size = 24, color = "#000" }) => {
  const icons = {
    home: "🏠",
    "home-outline": "🏠",
    car: "🚗",
    "car-outline": "🚗",
    cash: "💰",
    "cash-outline": "💰",
    person: "👤",
    "person-outline": "👤",
    settings: "⚙️",
    "settings-outline": "⚙️",
    power: "⚡",
    "power-outline": "⚡",
  };

  return <Text style={{ fontSize: size }}>{icons[name] || "●"}</Text>;
};

// Confirmation Modal Component
function StatusConfirmationModal({ visible, isOnline, onClose }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onClose());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.modalOverlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={
              isOnline
                ? theme.gradients.primary.colors
                : [theme.colors.neutral[500], theme.colors.neutral[600]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalGradient}
          >
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>{isOnline ? "✓" : "○"}</Text>
            </View>

            <Text style={styles.modalTitle}>
              {isOnline ? "YOU'RE ONLINE!" : "You're Offline"}
            </Text>

            <Text style={styles.modalSubtitle}>
              {isOnline
                ? "Ready to accept ride requests"
                : "You won't receive ride requests"}
            </Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Ride Preferences Modal
function RidePreferencesModal({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [preferences, setPreferences] = useState({
    acceptScheduled: true,
    maxPickupDistance: 10,
    autoAccept: false,
    minFare: 5,
    acceptPets: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem("ridePreferences");
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.log("Error loading preferences:", error);
    }
  };

  const savePreferences = async (newPrefs) => {
    try {
      await AsyncStorage.setItem("ridePreferences", JSON.stringify(newPrefs));
      setPreferences(newPrefs);
    } catch (error) {
      console.log("Error saving preferences:", error);
    }
  };

  const togglePreference = (key) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPrefs);
  };

  const updateValue = (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    savePreferences(newPrefs);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.prefsOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.prefsContainer,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.prefsHeader}>
              <Text style={styles.prefsTitle}>Ride Preferences</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.prefsContent}>
              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>Accept Scheduled Rides</Text>
                  <Text style={styles.prefDescription}>
                    Rides booked in advance
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    preferences.acceptScheduled && styles.toggleActive,
                  ]}
                  onPress={() => togglePreference("acceptScheduled")}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      preferences.acceptScheduled && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>Max Pickup Distance</Text>
                  <Text style={styles.prefDescription}>
                    {preferences.maxPickupDistance} miles away
                  </Text>
                </View>
                <View style={styles.distanceButtons}>
                  {[5, 10, 15, 20].map((distance) => (
                    <TouchableOpacity
                      key={distance}
                      style={[
                        styles.distanceButton,
                        preferences.maxPickupDistance === distance &&
                          styles.distanceButtonActive,
                      ]}
                      onPress={() => updateValue("maxPickupDistance", distance)}
                    >
                      <Text
                        style={[
                          styles.distanceButtonText,
                          preferences.maxPickupDistance === distance &&
                            styles.distanceButtonTextActive,
                        ]}
                      >
                        {distance}mi
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.prefRow}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>Accept Pets</Text>
                  <Text style={styles.prefDescription}>
                    Allow passengers with pets
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    preferences.acceptPets && styles.toggleActive,
                  ]}
                  onPress={() => togglePreference("acceptPets")}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      preferences.acceptPets && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>

              <View style={[styles.prefRow, styles.prefRowLast]}>
                <View style={styles.prefInfo}>
                  <Text style={styles.prefLabel}>Auto-Accept Rides ⚡</Text>
                  <Text style={styles.prefDescription}>
                    Automatically accept matching rides
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    preferences.autoAccept && styles.toggleActive,
                  ]}
                  onPress={() => togglePreference("autoAccept")}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      preferences.autoAccept && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.prefsFooter}>
              <Text style={styles.prefsFooterText}>
                These preferences help match you with rides that fit your
                schedule and comfort level
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: "transparent",
            elevation: 0,
            shadowOpacity: 0,
          },
          header: ({ navigation }) => (
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={theme.gradients.primary.start}
              end={theme.gradients.primary.end}
              style={{
                paddingTop: 15,
                paddingBottom: 16,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 20,
                      fontWeight: "700",
                      marginRight: 12,
                    }}
                  >
                    ‹
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  Ride Details
                </Text>
              </View>
            </LinearGradient>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function ActiveRidesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActiveRidesScreen" component={ActiveRidesScreen} />
      <Stack.Screen
        name="RideDetails"
        component={RideDetailsScreen}
        options={({ navigation }) => ({
          headerShown: true,
          headerStyle: {
            backgroundColor: "transparent",
            elevation: 0,
            shadowOpacity: 0,
          },
          header: ({ navigation }) => (
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={theme.gradients.primary.start}
              end={theme.gradients.primary.end}
              style={{
                paddingTop: 15,
                paddingBottom: 16,
                paddingHorizontal: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 20,
                      fontWeight: "700",
                      marginRight: 12,
                    }}
                  >
                    ‹
                  </Text>
                </TouchableOpacity>
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  Ride Details
                </Text>
              </View>
            </LinearGradient>
          ),
        })}
      />
    </Stack.Navigator>
  );
}

function PlaceholderScreen() {
  return <View />;
}

function TabNavigator() {
  const dispatch = useDispatch();
  const { isOnline } = useSelector((state) => state.rides);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [pendingOnlineState, setPendingOnlineState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    SoundService.initialize();
  }, []);

  useEffect(() => {
    const driverId = getCurrentDriverId();

    const unsubscribe = ReviewService.subscribeToDriverReviews(
      driverId,
      (ratingData) => {
        dispatch(setDriverRating(ratingData));
      }
    );

    return () => unsubscribe();
  }, [dispatch]);

  const toggleOnline = async () => {
    if (isLoading) return;

    const newState = !isOnline;
    setIsLoading(true);

    try {
      if (newState) {
        const location = await LocationService.getCurrentLocation();
        if (!location) {
          Alert.alert(
            "Location Required",
            "Please enable location services to go online."
          );
          setIsLoading(false);
          return;
        }
        Vibration.vibrate([0, 100, 50, 100, 50, 100]);
        SoundService.playOnlineSound();
      } else {
        Vibration.vibrate(200);
        SoundService.playOfflineSound();
      }

      dispatch(setOnlineStatus(newState));
      setPendingOnlineState(newState);
      setShowConfirmation(true);
    } catch (error) {
      console.log("Error toggling online:", error);
      Alert.alert("Error", "Could not change status. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOnline) {
    return (
      <>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color }) => {
              let iconName;
              if (route.name === "Dashboard") {
                iconName = focused ? "home" : "home-outline";
              } else if (route.name === "Preferences") {
                iconName = focused ? "settings" : "settings-outline";
              }
              return <Icon name={iconName} size={24} color={color} />;
            },
            tabBarActiveTintColor: theme.colors.primary.main,
            tabBarInactiveTintColor: theme.colors.neutral[500],
            headerShown: false,
            tabBarStyle: {
              backgroundColor: "#ffffff",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              height: 70,
              paddingBottom: 10,
              paddingTop: 8,
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "600",
              marginTop: 4,
            },
          })}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardStack}
            options={{ tabBarLabel: "Home" }}
          />
          <Tab.Screen
            name="GoOnline"
            component={PlaceholderScreen}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                toggleOnline();
              },
            }}
            options={{
              tabBarLabel: "Go Online",
              tabBarIcon: () => (
                <View style={styles.goOnlineIcon}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={{ fontSize: 26, marginTop: -2 }}>⚡</Text>
                  )}
                </View>
              ),
              tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: "600",
                marginTop: 6,
              },
            }}
          />
          <Tab.Screen
            name="Preferences"
            component={PlaceholderScreen}
            listeners={{
              tabPress: (e) => {
                e.preventDefault();
                setShowPreferences(true);
              },
            }}
            options={{ tabBarLabel: "Preferences" }}
          />
        </Tab.Navigator>

        <StatusConfirmationModal
          visible={showConfirmation}
          isOnline={pendingOnlineState}
          onClose={() => setShowConfirmation(false)}
        />

        <RidePreferencesModal
          visible={showPreferences}
          onClose={() => setShowPreferences(false)}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => {
            let iconName;
            if (route.name === "Dashboard") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "ActiveRides") {
              iconName = focused ? "car" : "car-outline";
            } else if (route.name === "Earnings") {
              iconName = focused ? "cash" : "cash-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "person" : "person-outline";
            }
            return <Icon name={iconName} size={22} color={color} />;
          },
          tabBarActiveTintColor: "#ffffff",
          tabBarInactiveTintColor: theme.colors.neutral[500],
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#ffffff",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginTop: -2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarActiveBackgroundColor: "transparent",
          tabBarInactiveBackgroundColor: "transparent",
          tabBarButton: (props) => {
            const isFocused = props.accessibilityState?.selected;
            return (
              <View
                style={{
                  overflow: "hidden",
                  borderRadius: 12,
                  marginHorizontal: 4,
                  flex: 1,
                }}
              >
                {isFocused && (
                  <LinearGradient
                    colors={theme.gradients.primary.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                <TouchableOpacity {...props} style={props.style}>
                  {props.children}
                </TouchableOpacity>
              </View>
            );
          },
        })}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardStack}
          options={{ tabBarLabel: "Home" }}
        />
        <Tab.Screen
          name="ActiveRides"
          component={ActiveRidesStack}
          options={{ tabBarLabel: "Active" }}
        />
        <Tab.Screen
          name="Earnings"
          component={EarningsScreen}
          options={{
            tabBarLabel: "Earnings",
            headerShown: true,
            headerStyle: {
              backgroundColor: "transparent",
              elevation: 0,
              shadowOpacity: 0,
            },
            header: () => (
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={theme.gradients.primary.start}
                end={theme.gradients.primary.end}
                style={{
                  paddingTop: 15,
                  paddingBottom: 16,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  Earnings
                </Text>
              </LinearGradient>
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: "Profile",
            headerShown: true,
            header: () => (
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={theme.gradients.primary.start}
                end={theme.gradients.primary.end}
                style={{
                  paddingTop: 15,
                  paddingBottom: 16,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  style={{
                    color: "#ffffff",
                    fontSize: 20,
                    fontWeight: "700",
                  }}
                >
                  Settings
                </Text>
              </LinearGradient>
            ),
          }}
        />
      </Tab.Navigator>

      <StatusConfirmationModal
        visible={showConfirmation}
        isOnline={pendingOnlineState}
        onClose={() => setShowConfirmation(false)}
      />

      <RidePreferencesModal
        visible={showPreferences}
        onClose={() => setShowPreferences(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  goOnlineIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary.main,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
  },
  centerButtonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    top: -15,
  },
  centerButton: {
    position: "relative",
  },
  centerButtonGradient: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.xl,
  },
  onlineIndicator: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.status.success,
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  centerButtonLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.8,
    borderRadius: 24,
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  modalGradient: {
    padding: 40,
    alignItems: "center",
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalIconText: {
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "700",
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  prefsOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  prefsContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
    ...theme.shadows.xl,
  },
  prefsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  prefsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 20,
    color: theme.colors.neutral[600],
    fontWeight: "400",
  },
  prefsContent: {
    padding: 20,
  },
  prefRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
  },
  prefRowLast: {
    borderBottomWidth: 0,
  },
  prefInfo: {
    marginBottom: 12,
  },
  prefLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  prefDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.neutral[300],
    padding: 2,
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  toggleActive: {
    backgroundColor: theme.colors.status.success,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ffffff",
    ...theme.shadows.sm,
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  distanceButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  distanceButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.neutral[100],
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.neutral[200],
  },
  distanceButtonActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  distanceButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  distanceButtonTextActive: {
    color: "#ffffff",
  },
  prefsFooter: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: theme.colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
  },
  prefsFooterText: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    lineHeight: 18,
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#ffffff" }}
        edges={["top", "bottom"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Provider store={store}>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
        </Provider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
