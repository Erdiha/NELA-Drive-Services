// services/rideLocationUpdater.js
// Manages updating driver location to active ride documents

import { db } from "./firebase";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import LocationService from "./locationService";

class RideLocationUpdater {
  constructor() {
    this.activeUpdates = new Map(); // rideId -> intervalId
    this.updateInterval = 15000; // 15 seconds
  }

  /**
   * Start updating location for a specific ride
   * @param {string} rideId - The ride document ID
   * @param {string} status - Current ride status
   */
  startUpdating(rideId, status) {
    // Only update for relevant statuses
    const updateableStatuses = ["accepted", "arrived", "in_progress"];
    if (!updateableStatuses.includes(status)) {
      console.log(`⏸️ Not updating location for status: ${status}`);
      return;
    }

    // Don't start if already updating
    if (this.activeUpdates.has(rideId)) {
      console.log(`✅ Already updating location for ride: ${rideId}`);
      return;
    }

    console.log(`🚀 Starting location updates for ride: ${rideId}`);

    // Initial update
    this.updateRideLocation(rideId);

    // Set up interval
    const intervalId = setInterval(() => {
      this.updateRideLocation(rideId);
    }, this.updateInterval);

    this.activeUpdates.set(rideId, intervalId);
  }

  /**
   * Stop updating location for a specific ride
   * @param {string} rideId - The ride document ID
   */
  stopUpdating(rideId) {
    const intervalId = this.activeUpdates.get(rideId);

    if (intervalId) {
      clearInterval(intervalId);
      this.activeUpdates.delete(rideId);
      console.log(`🛑 Stopped location updates for ride: ${rideId}`);
    }
  }

  /**
   * Update a single ride's location
   * @param {string} rideId - The ride document ID
   */
  async updateRideLocation(rideId) {
    try {
      // Get current driver location
      const location = LocationService.currentLocation;

      if (!location) {
        console.warn(`⚠️ No location available for ride: ${rideId}`);
        return;
      }

      // Update ride document
      const rideRef = doc(db, "rides", rideId);

      await updateDoc(rideRef, {
        driverLocation: {
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading || 0,
          speed: location.speed || 0,
          timestamp: location.timestamp || Date.now(),
        },
        locationUpdatedAt: Timestamp.now(),
      });

      console.log(`📍 Updated location for ride: ${rideId}`);
    } catch (error) {
      // Don't crash on errors, just log
      if (error.code === "not-found") {
        console.warn(`⚠️ Ride ${rideId} no longer exists, stopping updates`);
        this.stopUpdating(rideId);
      } else {
        console.error(
          `❌ Error updating location for ${rideId}:`,
          error.message
        );
      }
    }
  }

  /**
   * Stop all active updates (cleanup)
   */
  stopAllUpdates() {
    console.log(
      `🧹 Stopping all location updates (${this.activeUpdates.size} active)`
    );

    this.activeUpdates.forEach((intervalId, rideId) => {
      clearInterval(intervalId);
      console.log(`  - Stopped: ${rideId}`);
    });

    this.activeUpdates.clear();
  }

  /**
   * Get count of active updates
   */
  getActiveCount() {
    return this.activeUpdates.size;
  }

  /**
   * Check if ride is being updated
   */
  isUpdating(rideId) {
    return this.activeUpdates.has(rideId);
  }
}

// Export singleton instance
export default new RideLocationUpdater();
