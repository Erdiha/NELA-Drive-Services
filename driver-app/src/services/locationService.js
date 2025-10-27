import * as Location from "expo-location";
import { Alert } from "react-native";

class LocationService {
  constructor() {
    this.watchId = null;
    this.currentLocation = null;
    this.locationSubscribers = [];
  }

  // Request location permissions
  async requestPermissions() {
    try {
      // Check if location services are enabled first
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          "Location Services Disabled",
          "Please enable Location Services in your phone settings to use this app.",
          [{ text: "OK" }]
        );
        return false;
      }

      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        Alert.alert(
          "Location Permission Required",
          "This app needs location access to show your position to customers and navigate to pickups.",
          [{ text: "OK" }]
        );
        return false;
      }

      // Request background location for when app is in background
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== "granted") {
        Alert.alert(
          "Background Location",
          "For the best experience, allow location access even when the app is in the background.",
          [{ text: "OK" }]
        );
      }

      return true;
    } catch (error) {
      console.error("Error requesting location permissions:", error);
      return false;
    }
  }

  // Get current location once
  async getCurrentLocation() {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("Location permission not granted");
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      if (!location || !location.coords) {
        console.log("No location data received");
        return null;
      }

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };

      return this.currentLocation;
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert(
        "Location Error",
        "Unable to get your current location. Make sure Location Services are enabled in your phone settings."
      );
      return null;
    }
  }

  // Start watching location changes
  async startLocationTracking(callback) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("Location permission not granted for tracking");
        return null;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 20, // Or when moved 20 meters
        },
        (location) => {
          if (!location || !location.coords) {
            console.log("Invalid location data received");
            return;
          }

          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };

          // Notify all subscribers
          this.locationSubscribers.forEach((subscriber) => {
            subscriber(this.currentLocation);
          });

          // Call the callback
          if (callback) callback(this.currentLocation);
        }
      );

      return this.watchId;
    } catch (error) {
      console.error("Error starting location tracking:", error);
      Alert.alert(
        "Location Tracking Error",
        "Unable to start location tracking. Make sure Location Services are enabled."
      );
      return null;
    }
  }

  // Stop location tracking
  stopLocationTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  // Subscribe to location updates
  subscribeToLocationUpdates(callback) {
    this.locationSubscribers.push(callback);

    // Return unsubscribe function
    return () => {
      this.locationSubscribers = this.locationSubscribers.filter(
        (subscriber) => subscriber !== callback
      );
    };
  }

  // Calculate distance between two points (in kilometers)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Get estimated time to destination (very basic calculation)
  getEstimatedTime(distanceKm, averageSpeedKmh = 40) {
    const timeHours = distanceKm / averageSpeedKmh;
    const timeMinutes = Math.round(timeHours * 60);
    return timeMinutes;
  }
}

// Export singleton instance
export default new LocationService();
