import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import theme from "../theme/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function StatsModal({
  visible,
  onClose,
  todayStats,
  activeRides,
  onGoOffline,
}) {
  const handleGoOffline = () => {
    onClose();
    Alert.alert(
      "Go Offline?",
      "You won't receive any ride requests while offline.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Go Offline",
          style: "destructive",
          onPress: onGoOffline,
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Today's Summary</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalStats}>
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>${todayStats.earnings}</Text>
              <Text style={styles.modalStatLabel}>Earnings</Text>
            </View>
            <View style={styles.modalStatDivider} />
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>{todayStats.trips}</Text>
              <Text style={styles.modalStatLabel}>Trips</Text>
            </View>
            <View style={styles.modalStatDivider} />
            <View style={styles.modalStatItem}>
              <Text style={styles.modalStatValue}>{activeRides}</Text>
              <Text style={styles.modalStatLabel}>Active</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.goOfflineButtonWrapper}
            onPress={handleGoOffline}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={theme.gradients.primary.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goOfflineButton}
            >
              <Text style={styles.goOfflineText}>Go Offline</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  goOfflineButtonWrapper: {
    borderRadius: 12,
    overflow: "hidden",
  },

  goOfflineButton: {
    paddingVertical: 16,
    alignItems: "center",
  },

  goOfflineText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 32,
    minHeight: 300,
    ...theme.shadows.xl,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  modalClose: {
    fontSize: 24,
    color: "#666",
    fontWeight: "300",
  },

  modalStats: {
    flexDirection: "row",
    marginBottom: 24,
  },

  modalStatItem: {
    flex: 1,
    alignItems: "center",
  },

  modalStatValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#000",
    marginBottom: 4,
  },

  modalStatLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },

  modalStatDivider: {
    width: 1,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 16,
  },

  goOfflineButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },

  goOfflineText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
