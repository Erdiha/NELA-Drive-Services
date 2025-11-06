import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";

const OfflineControls = ({ visible, onClose, navigation, currentRoute }) => {
  return (
    <Modal
      key={visible ? "open" : "closed"}
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.quickActionsMenu}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              onClose();
              navigation.navigate("Settings");
            }}
          >
            {currentRoute === "RidePreferences" && (
              <LinearGradient
                colors={["#7c3aed", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <MaterialIcons
              name="tune"
              size={20}
              color={currentRoute === "RidePreferences" ? "#ffffff" : "#7c3aed"}
            />
            <Text
              style={[
                styles.controlText,
                currentRoute === "RidePreferences" && styles.controlTextActive,
              ]}
            >
              Ride Preferences
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={currentRoute === "RidePreferences" ? "#ffffff" : "#666"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              onClose();
              navigation.navigate("Earnings");
            }}
          >
            {currentRoute === "Earnings" && (
              <LinearGradient
                colors={["#7c3aed", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <MaterialIcons
              name="attach-money"
              size={20}
              color={currentRoute === "Earnings" ? "#ffffff" : "#7c3aed"}
            />
            <Text
              style={[
                styles.controlText,
                currentRoute === "Earnings" && styles.controlTextActive,
              ]}
            >
              View Earnings
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={currentRoute === "Earnings" ? "#ffffff" : "#666"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              onClose();
              navigation.navigate("Settings");
            }}
          >
            {currentRoute === "Settings" && (
              <LinearGradient
                colors={["#7c3aed", "#f59e0b"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <MaterialIcons
              name="settings"
              size={20}
              color={currentRoute === "Settings" ? "#ffffff" : "#7c3aed"}
            />
            <Text
              style={[
                styles.controlText,
                currentRoute === "Settings" && styles.controlTextActive,
              ]}
            >
              Driver Settings
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={currentRoute === "Settings" ? "#ffffff" : "#666"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    justifyContent: "flex-end",
    padding: 10,
  },
  quickActionsMenu: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 4,
  },
  controlText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginLeft: 12,
  },
  controlTextActive: {
    color: "#ffffff",
  },
});

export default OfflineControls;
