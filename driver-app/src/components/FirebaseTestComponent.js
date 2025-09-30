import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { db } from "../services/firebase";
import { collection, addDoc, getDocs, onSnapshot } from "firebase/firestore";

const FirebaseTestComponent = () => {
  const [connectionStatus, setConnectionStatus] = useState("Testing...");
  const [testRides, setTestRides] = useState([]);

  useEffect(() => {
    testFirebaseConnection();
    subscribeToTestRides();
  }, []);

  const testFirebaseConnection = async () => {
    try {
      // Try to read from Firestore
      const querySnapshot = await getDocs(collection(db, "test"));
      setConnectionStatus("✅ Firebase Connected Successfully!");
      console.log("Firebase connection successful");
    } catch (error) {
      setConnectionStatus(`❌ Firebase Error: ${error.message}`);
      console.error("Firebase connection failed:", error);
    }
  };

  const subscribeToTestRides = () => {
    try {
      const unsubscribe = onSnapshot(
        collection(db, "rides"),
        (snapshot) => {
          const rides = [];
          snapshot.forEach((doc) => {
            rides.push({ id: doc.id, ...doc.data() });
          });
          setTestRides(rides);
          console.log("Found rides:", rides.length);
        },
        (error) => {
          console.error("Error subscribing to rides:", error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up ride subscription:", error);
    }
  };

  const createTestRide = async () => {
    try {
      const testRide = {
        passengerName: "Test Customer",
        pickupLocation: "123 Test Street",
        destination: "456 Demo Avenue",
        estimatedFare: "12.50",
        estimatedTime: "15 min",
        distance: "2.8 km",
        passengerRating: 4.8,
        status: "pending",
        createdAt: new Date(),
        pickup: {
          latitude: 40.7128,
          longitude: -74.006,
          address: "123 Test Street, New York, NY",
        },
        dropoff: {
          latitude: 40.7589,
          longitude: -73.9851,
          address: "456 Demo Avenue, New York, NY",
        },
      };

      const docRef = await addDoc(collection(db, "rides"), testRide);
      Alert.alert("Success!", `Test ride created with ID: ${docRef.id}`);
    } catch (error) {
      Alert.alert("Error", `Failed to create test ride: ${error.message}`);
      console.error("Error creating test ride:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Firebase Test</Text>

      <Text style={styles.status}>{connectionStatus}</Text>

      <Text style={styles.info}>Rides in database: {testRides.length}</Text>

      <TouchableOpacity style={styles.button} onPress={createTestRide}>
        <Text style={styles.buttonText}>Create Test Ride</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={testFirebaseConnection}>
        <Text style={styles.buttonText}>Test Connection</Text>
      </TouchableOpacity>

      {testRides.length > 0 && (
        <View style={styles.ridesContainer}>
          <Text style={styles.ridesTitle}>Recent Rides:</Text>
          {testRides.slice(0, 3).map((ride) => (
            <Text key={ride.id} style={styles.rideItem}>
              📍 {ride.destination} - ${ride.estimatedFare}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  status: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  info: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#6b7280",
  },
  button: {
    backgroundColor: "#3B82F6",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: "#ffffff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  ridesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 8,
  },
  ridesTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  rideItem: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 5,
  },
});

export default FirebaseTestComponent;
