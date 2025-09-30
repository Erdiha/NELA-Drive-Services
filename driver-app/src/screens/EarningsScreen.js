import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import { calculateEarnings } from "../services/rideService";

const EarningsScreen = () => {
  const { completedRides } = useSelector((state) => state.rides);
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
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
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
        <Text style={styles.mainCardLabel}>Total Earnings</Text>
        <Text style={styles.mainCardAmount}>${earnings.totalEarnings}</Text>
        <Text style={styles.mainCardPeriod}>
          {periods.find((p) => p.key === selectedPeriod)?.label}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earnings.rideCount}</Text>
          <Text style={styles.statLabel}>Completed Rides</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${calculateAveragePerRide()}</Text>
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
            <Text style={styles.performanceValue}>⭐ 5.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  periodButtonActive: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  periodButtonTextActive: {
    color: "#ffffff",
  },
  mainCard: {
    backgroundColor: "#10b981",
    margin: 16,
    marginTop: 0,
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  mainCardLabel: {
    fontSize: 16,
    color: "#ffffff",
    opacity: 0.9,
    marginBottom: 8,
  },
  mainCardAmount: {
    fontSize: 48,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  mainCardPeriod: {
    fontSize: 14,
    color: "#ffffff",
    opacity: 0.8,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  section: {
    margin: 16,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
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
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  rideCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
    color: "#1f2937",
  },
  rideFare: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
  },
  rideDestination: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  rideDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  performanceCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  performanceLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  performanceValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
});

export default EarningsScreen;
