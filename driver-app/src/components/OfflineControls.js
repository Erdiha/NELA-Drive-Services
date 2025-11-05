import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import EarningsScreen from "../screens/EarningsScreen";
import RidePreferencesScreen from "../screens/RidePreferencesScreen";
import SettingsScreen from "../screens/SettingsScreen";

const { width } = Dimensions.get("window");

const OfflineControls = ({ visible, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const showContent = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const hideContent = () => {
    setCurrentSlide(0);
  };

  const handleOverlayPress = () => {
    onClose();
  };

  const handleContainerPress = (e) => {
    e.stopPropagation();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleOverlayPress}
      >
        {/* Content Container */}
        {currentSlide > 0 && (
          <View
            style={styles.carouselContainer}
            onStartShouldSetResponder={() => true}
          >
            {/* Earnings */}
            {currentSlide === 1 && (
              <View style={styles.slide}>
                <View style={styles.slideHeader}>
                  <TouchableOpacity onPress={hideContent}>
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.slideTitle}>Earnings</Text>
                  <View style={{ width: 24 }} />
                </View>
                <View style={styles.screenContainer}>
                  <EarningsScreen navigation={{ setOptions: () => {} }} />
                </View>
              </View>
            )}

            {/* Settings */}
            {currentSlide === 2 && (
              <View style={styles.slide}>
                <View style={styles.slideHeader}>
                  <TouchableOpacity onPress={hideContent}>
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.slideTitle}>Settings</Text>
                  <View style={{ width: 24 }} />
                </View>
                <View style={styles.screenContainer}>
                  <SettingsScreen />
                </View>
              </View>
            )}
            {/* Preferences */}
            {currentSlide === 3 && (
              <View style={styles.slide}>
                <View style={styles.slideHeader}>
                  <TouchableOpacity onPress={hideContent}>
                    <MaterialIcons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.slideTitle}>Ride Preferences</Text>
                  <View style={{ width: 24 }} />
                </View>
                <View style={styles.screenContainer}>
                  <RidePreferencesScreen />
                </View>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions Menu */}
        <View style={styles.quickActionsMenu}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              currentSlide === 3 && styles.controlButtonActive,
            ]}
            onPress={() => showContent(3)}
          >
            <MaterialIcons
              name="tune"
              size={20}
              color={currentSlide === 3 ? "#ffffff" : "#7c3aed"}
            />
            <Text
              style={[
                styles.controlText,
                currentSlide === 3 && styles.controlTextActive,
              ]}
            >
              Ride Preferences
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={currentSlide === 3 ? "#ffffff" : "#666"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              currentSlide === 1 && styles.controlButtonActive,
            ]}
            onPress={() => showContent(1)}
          >
            <MaterialIcons
              name="attach-money"
              size={20}
              color={currentSlide === 1 ? "#ffffff" : "#7c3aed"}
            />
            <Text
              style={[
                styles.controlText,
                currentSlide === 1 && styles.controlTextActive,
              ]}
            >
              View Earnings
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={currentSlide === 1 ? "#ffffff" : "#666"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.controlButton,
              currentSlide === 2 && styles.controlButtonActive,
            ]}
            onPress={() => showContent(2)}
          >
            <MaterialIcons
              name="settings"
              size={20}
              color={currentSlide === 2 ? "#ffffff" : "#7c3aed"}
            />
            <Text
              style={[
                styles.controlText,
                currentSlide === 2 && styles.controlTextActive,
              ]}
            >
              Driver Settings
            </Text>
            <MaterialIcons
              name="chevron-right"
              size={16}
              color={currentSlide === 2 ? "#ffffff" : "#666"}
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
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
    padding: 20,
  },
  carouselContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    bottom: 300,
    backgroundColor: "white",
    borderRadius: 20,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  slide: {
    width: width - 40,
    height: "100%",
  },
  slideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  slideTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  slideContent: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
  screenContainer: {
    flex: 1,
  },
  quickActionsMenu: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  controlText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginLeft: 12,
  },
  controlButtonActive: {
    backgroundColor: "#7c3aed",
  },
  controlTextActive: {
    color: "#ffffff",
  },
});

export default OfflineControls;
