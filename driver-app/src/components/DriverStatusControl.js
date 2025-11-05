import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import theme from "../theme/theme";

const DriverStatusControl = ({
  isOnline,
  onToggle,
  isLoading = false,
  earnings = "0.00",
  trips = 0,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isOnline) {
      // Pulsating animation when online
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isOnline]);

  const handlePress = () => {
    // Haptic feedback
    Vibration.vibrate(50);

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  return (
    <View style={styles.container}>
      {/* Quick Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>${earnings}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{trips}</Text>
          <Text style={styles.statLabel}>Trips</Text>
        </View>
      </View>

      {/* Main Status Button */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            transform: [{ scale: Animated.multiply(pulseAnim, scaleAnim) }],
          },
        ]}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={isLoading}
          activeOpacity={0.8}
          style={styles.button}
        >
          <LinearGradient
            colors={
              isOnline ? theme.gradients.primary.colors : ["#71717a", "#52525b"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <MaterialIcons name="hourglass-empty" size={24} color="white" />
                <Text style={styles.loadingText}>Connecting...</Text>
              </View>
            ) : (
              <View style={styles.statusContent}>
                <MaterialIcons
                  name={
                    isOnline ? "radio-button-checked" : "radio-button-unchecked"
                  }
                  size={28}
                  color="white"
                />
                <Text style={styles.statusText}>
                  {isOnline ? "You're Online" : "Go Online"}
                </Text>
                <Text style={styles.statusSubtext}>
                  {isOnline ? "Ready for trips" : "Start accepting rides"}
                </Text>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Status Indicator */}
      <View style={styles.statusIndicator}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: isOnline
                ? theme.colors.status.success
                : theme.colors.status.offline,
            },
          ]}
        />
        <Text
          style={[
            styles.statusIndicatorText,
            {
              color: isOnline
                ? theme.colors.status.success
                : theme.colors.status.offline,
            },
          ]}
        >
          {isOnline ? "ONLINE" : "OFFLINE"}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
  },
  statsBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
    ...theme.shadows.sm,
    borderWidth: 1,
    borderColor: theme.colors.background.border,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.background.border,
    marginHorizontal: 16,
  },
  buttonContainer: {
    marginBottom: 16,
  },
  button: {
    borderRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    minWidth: 200,
  },
  statusContent: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginTop: 4,
  },
  statusSubtext: {
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 4,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

export default DriverStatusControl;
