import { db } from "./firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  setDoc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import LocationService from "./locationService";
import NotificationService from "./notificationService";
import SMSService from "./smsService";

// Driver ID - Using your email as the unique identifier
const DRIVER_ID = "erdiha@gmail.com";

export function subscribeToNewRides(callback) {
  const q = query(
    collection(db, "rides"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const rides = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      rides.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        acceptedAt:
          data.acceptedAt?.toDate?.()?.toISOString() || data.acceptedAt,
        scheduledDateTime:
          data.scheduledDateTime?.toDate?.()?.toISOString() ||
          data.scheduledDateTime,
      });
    });

    rides.forEach((ride) => {
      NotificationService.sendNewRideNotification(ride);
    });

    callback(rides);
  });
}

export function subscribeToActiveRides(driverId, callback) {
  const q = query(
    collection(db, "rides"),
    where("driverId", "==", driverId),
    where("status", "in", ["accepted", "arrived", "in_progress"]),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const rides = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Timestamps to strings immediately
      rides.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        acceptedAt:
          data.acceptedAt?.toDate?.()?.toISOString() || data.acceptedAt,
        scheduledDateTime:
          data.scheduledDateTime?.toDate?.()?.toISOString() ||
          data.scheduledDateTime,
      });
    });
    callback(rides);
  });
}
export async function updateRideStatus(rideId, status, additionalData = {}) {
  try {
    const rideRef = doc(db, "rides", rideId);
    const updateData = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData,
    };

    // Add driver ID when accepting a ride
    if (status === "accepted") {
      updateData.driverId = DRIVER_ID;
      updateData.acceptedAt = Timestamp.now();
    }

    // Add completion data
    if (status === "completed") {
      updateData.completedAt = Timestamp.now();
    }

    await updateDoc(rideRef, updateData);

    // Send status update notification
    const statusMessages = {
      accepted: "Driver has accepted your ride request",
      arrived: "Driver has arrived at pickup location",
      in_progress: "Trip has started",
      completed: "Trip completed successfully",
    };

    if (statusMessages[status]) {
      NotificationService.sendRideUpdateNotification(
        "Ride Update",
        statusMessages[status],
        rideId
      );
    }

    return true;
  } catch (error) {
    console.error("Error updating ride status:", error);
    throw error;
  }
}

export async function updateDriverLocation(location) {
  try {
    const driverRef = doc(db, "drivers", DRIVER_ID);
    await setDoc(
      driverRef,
      {
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          heading: location.heading || 0,
          speed: location.speed || 0,
        },
        lastUpdated: Timestamp.now(),
        isOnline: true,
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Error updating driver location:", error);
  }
}

export async function setDriverOnlineStatus(isOnline) {
  try {
    const driverRef = doc(db, "drivers", DRIVER_ID);
    const updateData = {
      isOnline,
      lastUpdated: Timestamp.now(),
    };

    // Add current location if going online
    if (isOnline) {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        updateData.location = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      }
    }

    await setDoc(driverRef, updateData, { merge: true });
  } catch (error) {
    console.error("Error setting driver online status:", error);
    throw error;
  }
}

export async function getDriverProfile() {
  try {
    const driverRef = doc(db, "drivers", DRIVER_ID);
    const driverDoc = await getDoc(driverRef);

    if (driverDoc.exists()) {
      return { id: driverDoc.id, ...driverDoc.data() };
    } else {
      // Create default driver profile
      const defaultProfile = {
        name: "Erdi Haciogullari",
        email: "erdiha@gmail.com",
        phone: "",
        photoURL: null,
        vehicle: {
          make: "Toyota",
          model: "RAV4 Prime",
          year: "2024",
          color: "White with Black Trim",
          licensePlate: "9LXJ115",
        },
        rating: 5.0,
        totalRides: 0,
        isOnline: false,
        createdAt: Timestamp.now(),
      };

      await setDoc(driverRef, defaultProfile);
      return { id: DRIVER_ID, ...defaultProfile };
    }
  } catch (error) {
    console.error("Error getting driver profile:", error);
    throw error;
  }
}

export async function calculateEarnings(period = "today") {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = new Date(
          weekStart.getFullYear(),
          weekStart.getMonth(),
          weekStart.getDate()
        );
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const q = query(
      collection(db, "rides"),
      where("driverId", "==", DRIVER_ID),
      where("status", "==", "completed"),
      where("completedAt", ">=", Timestamp.fromDate(startDate))
    );

    return new Promise((resolve) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        let totalEarnings = 0;
        let rideCount = 0;

        snapshot.forEach((doc) => {
          const ride = doc.data();
          const fare = parseFloat(ride.finalFare || ride.estimatedFare || 0);
          totalEarnings += fare;
          rideCount++;
        });

        resolve({
          totalEarnings: totalEarnings.toFixed(2),
          rideCount,
          period,
        });

        unsubscribe();
      });
    });
  } catch (error) {
    console.error("Error calculating earnings:", error);
    return { totalEarnings: "0.00", rideCount: 0, period };
  }
}

// Get current driver ID
export function getCurrentDriverId() {
  return DRIVER_ID;
}
