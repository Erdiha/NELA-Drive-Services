// components/StarRating.js
// Unified star rating display component
// Supports full stars, half stars, and custom sizes

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import theme from "../theme/theme";

/**
 * StarRating Component
 * @param {number} rating - Rating value (0-5)
 * @param {number} size - Star size in pixels (default: 20)
 * @param {string} filledColor - Color for filled stars
 * @param {string} emptyColor - Color for empty stars
 * @param {boolean} showNumber - Show rating number next to stars
 * @param {string} style - Additional styles for container
 */
const StarRating = ({
  rating = 5.0,
  size = 20,
  filledColor = theme.colors.rating.starFilled,
  emptyColor = theme.colors.rating.starEmpty,
  showNumber = false,
  style,
}) => {
  const stars = [];
  const normalizedRating = Math.max(0, Math.min(5, rating)); // Clamp between 0-5

  for (let i = 1; i <= 5; i++) {
    const diff = normalizedRating - (i - 1);

    if (diff >= 1) {
      // Full star
      stars.push(
        <Text key={i} style={[styles.star, { fontSize: size, color: filledColor }]}>
          ★
        </Text>
      );
    } else if (diff > 0) {
      // Partial star - use opacity to show fill percentage
      stars.push(
        <View key={i} style={{ position: "relative", width: size, height: size }}>
          <Text
            style={[
              styles.star,
              {
                fontSize: size,
                color: emptyColor,
                position: "absolute",
              },
            ]}
          >
            ★
          </Text>
          <Text
            style={[
              styles.star,
              {
                fontSize: size,
                color: filledColor,
                position: "absolute",
                opacity: diff, // Partial fill
              },
            ]}
          >
            ★
          </Text>
        </View>
      );
    } else {
      // Empty star
      stars.push(
        <Text key={i} style={[styles.star, { fontSize: size, color: emptyColor }]}>
          ★
        </Text>
      );
    }
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>{stars}</View>
      {showNumber && (
        <Text style={[styles.ratingNumber, { fontSize: size * 0.8 }]}>
          {normalizedRating.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  star: {
    lineHeight: undefined, // Let the font handle line height
  },
  ratingNumber: {
    fontWeight: "600",
    color: theme.colors.rating.textPrimary,
    marginLeft: 4,
  },
});

export default StarRating;