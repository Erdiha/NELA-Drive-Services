import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import theme from '../theme/theme';

const DriverControlPanel = ({ 
  isOnline, 
  onGoOffline, 
  onOpenPreferences,
  todayStats = { trips: 0, earnings: '0.00' },
  activeRides = 0
}) => {
  const [breakMode, setBreakMode] = useState(false);

  const toggleBreakMode = () => {
    setBreakMode(!breakMode);
    // Here you would typically call a service to update break status
  };

  return (
    <View style={styles.container}>
      {/* Online Status Header */}
      <View style={styles.header}>
        <View style={styles.statusInfo}>
          <View style={styles.onlineIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.onlineText}>ONLINE</Text>
          </View>
          <Text style={styles.statusSubtext}>Ready for ride requests</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.offlineButton}
          onPress={onGoOffline}
        >
          <MaterialIcons name="power-settings-new" size={20} color="#ef4444" />
          <Text style={styles.offlineButtonText}>Go Offline</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${todayStats.earnings}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayStats.trips}</Text>
          <Text style={styles.statLabel}>Trips Complete</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{activeRides}</Text>
          <Text style={styles.statLabel}>Active Rides</Text>
        </View>
      </View>

      {/* Control Options */}
      <View style={styles.controlsSection}>
        {/* Break Mode Toggle */}
        <View style={styles.controlRow}>
          <View style={styles.controlInfo}>
            <MaterialIcons name="local-cafe" size={20} color="#666" />
            <View style={styles.controlTextContainer}>
              <Text style={styles.controlTitle}>Break Mode</Text>
              <Text style={styles.controlSubtext}>
                {breakMode ? "You won't receive new requests" : "Pause new ride requests"}
              </Text>
            </View>
          </View>
          <Switch
            value={breakMode}
            onValueChange={toggleBreakMode}
            trackColor={{ false: '#d1d5db', true: theme.colors.primary.light }}
            thumbColor={breakMode ? theme.colors.primary.main : '#f9fafb'}
          />
        </View>

        {/* Ride Preferences */}
        <TouchableOpacity 
          style={styles.controlRow}
          onPress={onOpenPreferences}
        >
          <View style={styles.controlInfo}>
            <MaterialIcons name="tune" size={20} color="#666" />
            <View style={styles.controlTextContainer}>
              <Text style={styles.controlTitle}>Ride Preferences</Text>
              <Text style={styles.controlSubtext}>Distance, ride types, and filters</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>

        {/* Destination Mode */}
        <TouchableOpacity style={styles.controlRow}>
          <View style={styles.controlInfo}>
            <MaterialIcons name="navigation" size={20} color="#666" />
            <View style={styles.controlTextContainer}>
              <Text style={styles.controlTitle}>Destination Mode</Text>
              <Text style={styles.controlSubtext}>Get rides towards a destination</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#666" />
        </TouchableOpacity>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.border,
  },
  statusInfo: {
    flex: 1,
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.status.success,
    marginRight: 8,
  },
  onlineText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.status.success,
    letterSpacing: 0.5,
  },
  statusSubtext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  offlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  offlineButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  controlsSection: {
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  controlInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  controlTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  controlTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  controlSubtext: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '400',
  },
});

export default DriverControlPanel;