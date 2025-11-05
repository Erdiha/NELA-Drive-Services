import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
import theme from "../theme/theme";

const RidePreferencesScreen = () => {
  const [preferences, setPreferences] = useState({
    maxPickupDistance: 15,
    acceptEconomy: true,
    acceptPremium: true,
    acceptXL: true,
    breakMode: false,
    minFare: 5,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem("ridePreferences");
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      await AsyncStorage.setItem(
        "ridePreferences",
        JSON.stringify(preferences)
      );
      Alert.alert("Success", "Preferences saved!");
    } catch (error) {
      Alert.alert("Error", "Failed to save preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = (key, value) => {
    setPreferences({ ...preferences, [key]: value });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Pickup Distance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Maximum Pickup Distance</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.distanceValue}>
            {preferences.maxPickupDistance} miles
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={30}
            step={1}
            value={preferences.maxPickupDistance}
            onValueChange={(value) =>
              updatePreference("maxPickupDistance", value)
            }
            minimumTrackTintColor={theme.colors.primary.main}
            maximumTrackTintColor="#d1d5db"
            thumbTintColor={theme.colors.primary.main}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>5 mi</Text>
            <Text style={styles.sliderLabel}>30 mi</Text>
          </View>
        </View>
      </View>

      {/* Ride Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ride Types</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🚗 Economy</Text>
            <Text style={styles.toggleSubtext}>Standard rides</Text>
          </View>
          <Switch
            value={preferences.acceptEconomy}
            onValueChange={(value) => updatePreference("acceptEconomy", value)}
            trackColor={{ false: "#d1d5db", true: theme.colors.primary.light }}
            thumbColor={
              preferences.acceptEconomy ? theme.colors.primary.main : "#f9fafb"
            }
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>⭐ Premium</Text>
            <Text style={styles.toggleSubtext}>Higher-end vehicles</Text>
          </View>
          <Switch
            value={preferences.acceptPremium}
            onValueChange={(value) => updatePreference("acceptPremium", value)}
            trackColor={{ false: "#d1d5db", true: theme.colors.primary.light }}
            thumbColor={
              preferences.acceptPremium ? theme.colors.primary.main : "#f9fafb"
            }
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>🚙 XL Rides</Text>
            <Text style={styles.toggleSubtext}>6+ passengers</Text>
          </View>
          <Switch
            value={preferences.acceptXL}
            onValueChange={(value) => updatePreference("acceptXL", value)}
            trackColor={{ false: "#d1d5db", true: theme.colors.primary.light }}
            thumbColor={
              preferences.acceptXL ? theme.colors.primary.main : "#f9fafb"
            }
          />
        </View>
      </View>

      {/* Break Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Controls</Text>

        <View style={styles.toggleRow}>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleTitle}>☕ Break Mode</Text>
            <Text style={styles.toggleSubtext}>Pause new requests</Text>
          </View>
          <Switch
            value={preferences.breakMode}
            onValueChange={(value) => updatePreference("breakMode", value)}
            trackColor={{ false: "#d1d5db", true: theme.colors.primary.light }}
            thumbColor={
              preferences.breakMode ? theme.colors.primary.main : "#f9fafb"
            }
          />
        </View>
      </View>

      {/* Minimum Fare */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minimum Fare</Text>
        <View style={styles.sliderContainer}>
          <Text style={styles.distanceValue}>${preferences.minFare}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={20}
            step={1}
            value={preferences.minFare}
            onValueChange={(value) => updatePreference("minFare", value)}
            minimumTrackTintColor={theme.colors.primary.main}
            maximumTrackTintColor="#d1d5db"
            thumbTintColor={theme.colors.primary.main}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>$0</Text>
            <Text style={styles.sliderLabel}>$20</Text>
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButtonContainer}
        onPress={savePreferences}
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
            {loading ? "Saving..." : "Save Preferences"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  section: {
    backgroundColor: theme.colors.background.card,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  sliderContainer: {
    marginTop: 8,
  },
  distanceValue: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.colors.primary.main,
    textAlign: "center",
    marginBottom: 16,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.border,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  toggleSubtext: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  saveButtonContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  saveButton: {
    padding: 18,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
});

export default RidePreferencesScreen;
