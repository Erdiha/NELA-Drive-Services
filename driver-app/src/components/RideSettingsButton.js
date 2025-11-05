import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import theme from "./theme";

const RideSettingsButton = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <MaterialIcons
          name="tune"
          size={20}
          color={theme.colors.primary.main}
        />
      </View>
      <Text style={styles.text}>Ride Settings</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 130,
    left: 20,
    right: 20,
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    ...theme.shadows.md,
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.primary,
    flex: 1,
  },
});

export default RideSettingsButton;
