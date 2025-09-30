import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getCurrentDriverId } from "../services/rideService";

export default function SettingsScreen() {
  const [profile, setProfile] = useState({
    name: "Erdi Haciogullari",
    email: "erdiha@gmail.com",
    phone: "",
    photoURL: "https://i.imgur.com/uYhkACU.jpeg",
    vehicle: {
      make: "Toyota",
      model: "RAV4 Prime",
      year: "2024",
      color: "White with Black Trim",
      licensePlate: "9LXJ115",
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("driverProfile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem("driverProfile", JSON.stringify(profile));

      // Save to Firebase
      const driverRef = doc(db, "drivers", getCurrentDriverId());
      await setDoc(driverRef, profile, { merge: true });

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const updateVehicle = (field, value) => {
    setProfile({
      ...profile,
      vehicle: { ...profile.vehicle, [field]: value },
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Driver Profile</Text>
          <Text style={styles.headerSubtitle}>
            This information is shared with passengers
          </Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {profile.photoURL ? (
              <Image source={{ uri: profile.photoURL }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.photoUrlInputContainer}>
            {/* <Text style={styles.photoUrlLabel}>Profile Photo URL:</Text>
            <Text style={styles.photoUrlHint}>
              1. Upload to imgur.com{"\n"}
              2. Right-click image → "Copy image address"{"\n"}
              3. Paste link below (should end in .jpg or .png)
            </Text> */}
            {/* <TextInput
              style={styles.input}
              value={profile.photoURL || ""}
              onChangeText={(text) =>
                setProfile({
                  ...profile,
                  photoURL: "https://i.imgur.com/uYhkACU.jpeg",
                })
              }
              placeholder="https://i.imgur.com/uYhkACU.jpeg"
              autoCapitalize="none"
              autoCorrect={false}
            /> */}
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => updateProfile("name", text)}
              placeholder="Enter your name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => updateProfile("email", text)}
              placeholder="your.email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phone}
              onChangeText={(text) => updateProfile("phone", text)}
              placeholder="+1 (234) 567-8900"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.make}
              onChangeText={(text) => updateVehicle("make", text)}
              placeholder="Toyota"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.model}
              onChangeText={(text) => updateVehicle("model", text)}
              placeholder="RAV4 Prime"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.year}
              onChangeText={(text) => updateVehicle("year", text)}
              placeholder="2024"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.color}
              onChangeText={(text) => updateVehicle("color", text)}
              placeholder="White with Black Trim"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>License Plate</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.licensePlate}
              onChangeText={(text) => updateVehicle("licensePlate", text)}
              placeholder="9LXJ115"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveProfile}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save Profile"}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Driver ID: {getCurrentDriverId()}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    backgroundColor: "#475569",
    padding: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#cbd5e1",
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "#ffffff",
    marginBottom: 16,
  },
  photoContainer: {
    marginBottom: 20,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#10b981",
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#475569",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#10b981",
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: "#ffffff",
    fontWeight: "700",
  },
  photoUrlInputContainer: {
    width: "100%",
  },
  photoUrlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  photoUrlHint: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 18,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
  section: {
    backgroundColor: "#ffffff",
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  saveButton: {
    backgroundColor: "#10b981",
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});
