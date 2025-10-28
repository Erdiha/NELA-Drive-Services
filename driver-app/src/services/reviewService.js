// services/reviewService.js
// Centralized review management with real-time updates

import { db } from "./firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

class ReviewService {
  constructor() {
    this.activeListeners = new Map(); // driverId -> unsubscribe function
    this.cachedRatings = new Map(); // driverId -> { average, count, reviews }
  }

  /**
   * Subscribe to real-time driver reviews
   * @param {string} driverId - Driver's unique ID
   * @param {function} callback - Called with { average, count, reviews }
   * @returns {function} Unsubscribe function
   */
  subscribeToDriverReviews(driverId, callback) {
    // Don't create duplicate listeners
    if (this.activeListeners.has(driverId)) {
      console.log(`⚠️ Already listening to reviews for ${driverId}`);
      return this.activeListeners.get(driverId);
    }

    console.log(`🔔 Subscribing to reviews for driver: ${driverId}`);

    const q = query(
      collection(db, "reviews"),
      where("driverId", "==", driverId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reviews = [];
        let totalRating = 0;

        snapshot.forEach((doc) => {
          const reviewData = {
            id: doc.id,
            ...doc.data(),
            createdAt:
              doc.data().createdAt?.toDate?.()?.toISOString() ||
              doc.data().createdAt,
          };
          reviews.push(reviewData);
          totalRating += reviewData.rating || 0;
        });

        const count = reviews.length;
        const average = count > 0 ? (totalRating / count).toFixed(1) : "5.0";

        const result = {
          average: parseFloat(average),
          count,
          reviews,
          lastUpdated: new Date().toISOString(),
        };

        // Cache the result
        this.cachedRatings.set(driverId, result);

        console.log(`✅ Reviews updated: ${count} reviews, avg ${average}`);
        callback(result);
      },
      (error) => {
        console.error("❌ Error listening to reviews:", error);
        callback({
          average: 5.0,
          count: 0,
          reviews: [],
          error: error.message,
        });
      }
    );

    this.activeListeners.set(driverId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Fetch driver reviews once (no real-time)
   * @param {string} driverId
   * @returns {Promise<{average, count, reviews}>}
   */
  async fetchDriverReviews(driverId) {
    try {
      console.log(`📥 Fetching reviews for driver: ${driverId}`);

      const q = query(
        collection(db, "reviews"),
        where("driverId", "==", driverId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const reviews = [];
      let totalRating = 0;

      snapshot.forEach((doc) => {
        const reviewData = {
          id: doc.id,
          ...doc.data(),
          createdAt:
            doc.data().createdAt?.toDate?.()?.toISOString() ||
            doc.data().createdAt,
        };
        reviews.push(reviewData);
        totalRating += reviewData.rating || 0;
      });

      const count = reviews.length;
      const average = count > 0 ? (totalRating / count).toFixed(1) : "5.0";

      const result = {
        average: parseFloat(average),
        count,
        reviews,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the result
      this.cachedRatings.set(driverId, result);

      console.log(`✅ Fetched ${count} reviews, average: ${average}`);
      return result;
    } catch (error) {
      console.error("❌ Error fetching reviews:", error);
      return {
        average: 5.0,
        count: 0,
        reviews: [],
        error: error.message,
      };
    }
  }

  /**
   * Get top compliment tags from reviews
   * @param {Array} reviews - Array of review objects
   * @param {number} topN - Number of top tags to return
   * @returns {Array} [{tag, count}]
   */
  getTopCompliments(reviews, topN = 3) {
    const tagCounts = {};

    reviews.forEach((review) => {
      if (review.tags && Array.isArray(review.tags)) {
        review.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([tag, count]) => ({ tag, count }));
  }

  /**
   * Get cached rating (if available)
   * @param {string} driverId
   * @returns {object|null}
   */
  getCachedRating(driverId) {
    return this.cachedRatings.get(driverId) || null;
  }

  /**
   * Unsubscribe from driver reviews
   * @param {string} driverId
   */
  unsubscribeFromDriver(driverId) {
    const unsubscribe = this.activeListeners.get(driverId);
    if (unsubscribe) {
      unsubscribe();
      this.activeListeners.delete(driverId);
      console.log(`🔕 Unsubscribed from reviews for ${driverId}`);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    console.log(`🧹 Cleaning up ${this.activeListeners.size} review listeners`);
    this.activeListeners.forEach((unsubscribe, driverId) => {
      unsubscribe();
      console.log(`  - Cleaned: ${driverId}`);
    });
    this.activeListeners.clear();
    this.cachedRatings.clear();
  }

  /**
   * Get active listener count
   */
  getActiveListenerCount() {
    return this.activeListeners.size;
  }
}

export default new ReviewService();
