import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSelector } from "react-redux";
import { calculateEarnings } from "../services/rideService";
import theme from "../theme/theme";

const AnimatedNumber = ({
  value,
  duration = 1000,
  style,
  prefix = "",
  decimals = 2,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const numValue = parseFloat(value) || 0;
    let start = 0;
    const end = numValue;
    const increment = end / (duration / 16);

    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  const formatted =
    decimals === 0
      ? Math.floor(displayValue).toString()
      : displayValue.toFixed(decimals);

  return (
    <Text style={style}>
      {prefix}
      {formatted}
    </Text>
  );
};

const EarningsScreen = () => {
  const { completedRides, rating } = useSelector((state) => state.rides);
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [earnings, setEarnings] = useState({
    totalEarnings: "0.00",
    rideCount: 0,
    period: "today",
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEarnings();
  }, [selectedPeriod]);

  const loadEarnings = async () => {
    const data = await calculateEarnings(selectedPeriod);
    setEarnings(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEarnings();
    setRefreshing(false);
  };

  const periods = [
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
  ];

  const calculateAveragePerRide = () => {
    if (earnings.rideCount === 0) return "0.00";
    return (parseFloat(earnings.totalEarnings) / earnings.rideCount).toFixed(2);
  };

  const getRecentCompletedRides = () => {
    return completedRides
      .slice()
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={styles.periodButton}
            onPress={() => setSelectedPeriod(period.key)}
          >
            {selectedPeriod === period.key && (
              <LinearGradient
                colors={theme.gradients.primary.colors}
                start={theme.gradients.primary.start}
                end={theme.gradients.primary.end}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Earnings Card */}
      <View style={styles.mainCard}>
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.mainCardGradient}
        >
          <Text style={styles.mainCardLabel}>Total Earnings</Text>
          <AnimatedNumber
            value={earnings.totalEarnings}
            duration={1200}
            style={styles.mainCardAmount}
            prefix="$"
          />
          <Text style={styles.mainCardPeriod}>
            {periods.find((p) => p.key === selectedPeriod)?.label}
          </Text>
        </LinearGradient>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <AnimatedNumber
            value={earnings.rideCount}
            duration={800}
            style={styles.statValue}
            decimals={0}
          />
          <Text style={styles.statLabel}>Completed Rides</Text>
        </View>
        <View style={styles.statCard}>
          <AnimatedNumber
            value={calculateAveragePerRide()}
            duration={800}
            style={styles.statValue}
            prefix="$"
            decimals={2}
          />
          <Text style={styles.statLabel}>Avg per Ride</Text>
        </View>
      </View>

      {/* Recent Rides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Completed Rides</Text>
        {getRecentCompletedRides().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No completed rides yet. Start accepting rides to earn money!
            </Text>
          </View>
        ) : (
          getRecentCompletedRides().map((ride) => (
            <View key={ride.id} style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <Text style={styles.rideName}>
                  {ride.passengerName || "Anonymous"}
                </Text>
                <Text style={styles.rideFare}>
                  ${ride.finalFare || ride.estimatedFare || ride.fare}
                </Text>
              </View>
              <Text style={styles.rideDestination} numberOfLines={1}>
                {ride.destination || ride.dropoff?.address}
              </Text>
              <Text style={styles.rideDate}>
                {ride.completedAt
                  ? new Date(ride.completedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "Recently completed"}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceCard}>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Acceptance Rate</Text>
            <Text style={styles.performanceValue}>
              {completedRides.length > 0 ? "100%" : "N/A"}
            </Text>
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Total Lifetime Rides</Text>
            <Text style={styles.performanceValue}>{completedRides.length}</Text>
          </View>
          <View style={styles.performanceRow}>
            <Text style={styles.performanceLabel}>Rating</Text>
            <Text style={styles.performanceValue}>★ {rating.average}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  periodSelector: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: theme.colors.background.border,
    alignItems: "center",
    overflow: "hidden",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  periodButtonTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  mainCard: {
    margin: 10,
    marginTop: 0,
    borderRadius: 16,
    overflow: "hidden",
    ...theme.shadows.xl,
  },
  mainCardGradient: {
    padding: 20,
    alignItems: "center",
  },
  mainCardLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  mainCardAmount: {
    fontSize: 56,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  mainCardPeriod: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    ...theme.shadows.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  rideCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.background.border,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  rideName: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  rideFare: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary.main,
  },
  rideDestination: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  performanceCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    ...theme.shadows.sm,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.border,
  },
  performanceLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
});

export default EarningsScreen;
