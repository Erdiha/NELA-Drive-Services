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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, storage } from "../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { getCurrentDriverId } from "../services/rideService";
import { LinearGradient } from "expo-linear-gradient";
import theme from "../theme/theme";
import { useSelector } from "react-redux";

const StarRating = ({ rating }) => {
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    const diff = rating - (i - 1);

    if (diff >= 1) {
      // Full star
      stars.push(
        <Text key={i} style={{ fontSize: 25, color: "#fbbf24" }}>
          ★
        </Text>
      );
    } else if (diff > 0) {
      // Partial star - use opacity to show fill
      stars.push(
        <View key={i} style={{ position: "relative", width: 25, height: 25 }}>
          <Text
            style={{ fontSize: 25, color: "#e5e7eb", position: "absolute" }}
          >
            ★
          </Text>
          <Text
            style={{
              fontSize: 25,
              color: "#fbbf24",
              position: "absolute",
              opacity: diff,
            }}
          >
            ★
          </Text>
        </View>
      );
    } else {
      // Empty star
      stars.push(
        <Text key={i} style={{ fontSize: 25, color: "#e5e7eb" }}>
          ★
        </Text>
      );
    }
  }

  return <View style={{ flexDirection: "row", gap: 2 }}>{stars}</View>;
};
export default function SettingsScreen() {
  const [profile, setProfile] = useState({
    name: "Erdi Haciogullari",
    email: "erdiha@gmail.com",
    phone: "",
    photoURL: null,
    vehicle: {
      make: "Toyota",
      model: "RAV4 Prime",
      year: "2024",
      color: "White with Black Trim",
      licensePlate: "9LXJ115",
      photoURL: null,
    },
  });
  const [loading, setLoading] = useState(false);
  const { completedRides } = useSelector((state) => state.rides);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState("5.0");

  const calculateAverageRating = () => {
    if (reviews.length === 0) return "5.0";
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      // Fetch from Firebase (source of truth)
      const driverRef = doc(db, "drivers", getCurrentDriverId());
      const driverDoc = await getDoc(driverRef);

      if (driverDoc.exists()) {
        const firebaseProfile = driverDoc.data();
        setProfile(firebaseProfile);
        // Update AsyncStorage cache
        await AsyncStorage.setItem(
          "driverProfile",
          JSON.stringify(firebaseProfile)
        );
      } else {
        // Fallback to AsyncStorage only if Firebase has nothing
        const savedProfile = await AsyncStorage.getItem("driverProfile");
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviewsRef = collection(db, "reviews");
        const q = query(
          reviewsRef,
          where("driverId", "==", getCurrentDriverId())
        );

        const snapshot = await getDocs(q);
        const fetchedReviews = [];

        snapshot.forEach((doc) => {
          fetchedReviews.push({ id: doc.id, ...doc.data() });
        });

        setReviews(fetchedReviews);

        // Calculate average
        if (fetchedReviews.length > 0) {
          const sum = fetchedReviews.reduce(
            (acc, review) => acc + review.rating,
            0
          );
          const avg = (sum / fetchedReviews.length).toFixed(1);
          setAverageRating(avg);
          console.log(
            `✅ Loaded ${fetchedReviews.length} reviews, average: ${avg}`
          );
        } else {
          console.log(`✅ No reviews found yet`);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, []);

  const uploadProfilePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profiles/${getCurrentDriverId()}.jpg`);

        await uploadBytes(storageRef, blob);
        const url = await getDownloadURL(storageRef);

        setProfile({ ...profile, photoURL: url });
        Alert.alert("Success", "Profile photo uploaded!");
      }
    } catch (error) {
      console.error("Photo upload error:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    }
  };

  const saveProfile = async () => {
    if (!profile.photoURL) {
      Alert.alert("Required", "Please upload a profile photo before saving.");
      return;
    }

    setLoading(true);
    try {
      await AsyncStorage.setItem("driverProfile", JSON.stringify(profile));
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
        {/* Gradient Header */}
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.background.primary },
          ]}
        >
          <Text
            style={[styles.headerTitle, { color: theme.colors.text.primary }]}
          >
            Driver Profile
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.text.secondary },
            ]}
          >
            This information is shared with passengers
          </Text>
        </View>

        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <View style={styles.photoContainer}>
            {profile.photoURL ? (
              <Image
                source={{ uri: profile.photoURL }}
                style={styles.photo}
                onError={(error) => {
                  console.log("Image load failed:", error);
                  setProfile({ ...profile, photoURL: null });
                }}
                defaultSource={require("../../assets/logo.png")}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* ADD THIS BEFORE THE CLOSING </View> OF photoContainer */}
            <TouchableOpacity
              style={styles.editPhotoButton}
              onPress={uploadProfilePhoto}
            >
              <Text style={styles.editPhotoIcon}>✏️</Text>
            </TouchableOpacity>
          </View>
          {/* Rating Display */}
          <View style={styles.ratingContainer}>
            <StarRating rating={parseFloat(calculateAverageRating())} />
            <Text style={styles.ratingText}>{calculateAverageRating()}</Text>
            <Text style={styles.ratingLabel}>
              {reviews.length} {reviews.length === 1 ? "rating" : "ratings"}
            </Text>
            {/* Top Compliments */}
            {reviews.length > 0 &&
              (() => {
                // Count all tags
                const tagCounts = {};
                reviews.forEach((review) => {
                  if (review.tags) {
                    review.tags.forEach((tag) => {
                      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                    });
                  }
                });

                // Sort by most common
                const topTags = Object.entries(tagCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3);

                if (topTags.length === 0) return null;

                return (
                  <View style={styles.complimentsSection}>
                    <Text style={styles.complimentsTitle}>Riders say</Text>
                    <View style={styles.complimentsContainer}>
                      {topTags.map(([tag, count]) => (
                        <View key={tag} style={styles.complimentBadge}>
                          <Text style={styles.complimentIcon}>✓</Text>
                          <Text style={styles.complimentText}>
                            {tag.replace(/_/g, " ")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })()}
          </View>

          <View style={styles.photoUrlInputContainer}>
            {/* existing commented code stays */}
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
              placeholderTextColor={theme.colors.text.tertiary}
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
              placeholderTextColor={theme.colors.text.tertiary}
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
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          {/* Car Photo */}
          <View style={styles.carPhotoContainer}>
            <Image
              source={require("../../assets/toyota_rav4_prime.png")}
              style={styles.carPhoto}
            />
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.carPhotoBadge}
            >
              <Text style={styles.carPhotoBadgeText}>Your Vehicle</Text>
            </LinearGradient>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Make</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.make}
              onChangeText={(text) => updateVehicle("make", text)}
              placeholder="Toyota"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Model</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.model}
              onChangeText={(text) => updateVehicle("model", text)}
              placeholder="RAV4 Prime"
              placeholderTextColor={theme.colors.text.tertiary}
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
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Color</Text>
            <TextInput
              style={styles.input}
              value={profile.vehicle.color}
              onChangeText={(text) => updateVehicle("color", text)}
              placeholder="White with Black Trim"
              placeholderTextColor={theme.colors.text.tertiary}
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
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButtonContainer}
          onPress={saveProfile}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={theme.gradients.primary.colors}
            start={theme.gradients.primary.start}
            end={theme.gradients.primary.end}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : "Save Profile"}
            </Text>
          </LinearGradient>
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
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    padding: theme.spacing.xl,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.onPrimary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: "rgba(255, 255, 255, 0.9)",
  },
  photoSection: {
    alignItems: "center",
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background.card,
    marginBottom: theme.spacing.md,
  },
  photoContainer: {
    marginBottom: theme.spacing.lg,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary.light,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: theme.colors.primary.light,
  },
  photoPlaceholderText: {
    fontSize: 48,
    color: theme.colors.text.onPrimary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  uploadButtonContainer: {
    borderRadius: theme.layout.borderRadius.md,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  uploadButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
  },
  uploadButtonText: {
    color: theme.colors.text.onPrimary,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  carPhotoContainer: {
    width: "100%",
    height: 180,
    borderRadius: theme.layout.borderRadius.lg,
    overflow: "hidden",
    marginBottom: theme.spacing.lg,
    position: "relative",
    backgroundColor: theme.colors.background.secondary,
  },
  carPhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  carPhotoBadge: {
    position: "absolute",
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.full,
  },
  carPhotoBadgeText: {
    color: theme.colors.text.onPrimary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: "center",
    textTransform: "uppercase",
  },
  section: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.layout.borderRadius.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.background.border,
    borderRadius: theme.layout.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
  },
  saveButtonContainer: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.layout.borderRadius.lg,
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  saveButton: {
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  saveButtonText: {
    color: theme.colors.text.onPrimary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
  ratingContainer: {
    marginTop: 12,
    alignItems: "center",
  },
  ratingText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  ratingLabel: {
    fontSize: 13,
    color: "#6b7280",
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  editPhotoIcon: {
    fontSize: 16,
  },
  complimentsSection: {
    width: "100%",
    marginTop: 20,
  },
  complimentsTitle: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 12,
    fontWeight: "500",
  },
  complimentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  complimentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  complimentIcon: {
    fontSize: 14,
    color: "#10b981",
  },
  complimentText: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
    textTransform: "capitalize",
  },
});
