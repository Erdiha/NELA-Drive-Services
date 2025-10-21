/* eslint-disable no-unused-vars */
import { db, functions } from "./firebase";
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
  deleteDoc,
} from "firebase/firestore";
import LocationService from "./locationService";
import SMSService from "./smsService";
import NotificationService from "./notificationService";
import ReceiptService from "./receiptService";

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
    console.log(`📝 Updating ride ${rideId} to status: ${status}`);

    const rideRef = doc(db, "rides", rideId);
    const rideDoc = await getDoc(rideRef);

    if (!rideDoc.exists()) {
      console.warn(`⚠️ Ride ${rideId} does not exist in Firebase`);
      const error = new Error("Ride not found");
      error.code = "not-found";
      throw error;
    }

    const rideData = rideDoc.data();

    const updateData = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData,
    };

    if (status === "accepted") {
      updateData.driverId = DRIVER_ID;
      updateData.acceptedAt = Timestamp.now();
    }

    if (status === "completed") {
      updateData.completedAt = Timestamp.now();
    }

    if (status === "cancelled") {
      updateData.cancelledAt = Timestamp.now();
      if (!updateData.cancelledBy) {
        updateData.cancelledBy = DRIVER_ID;
      }
      if (!updateData.cancelReason) {
        updateData.cancelReason = "Cancelled by driver";
      }
    }

    await updateDoc(rideRef, updateData);
    console.log(`✅ Ride ${rideId} updated successfully`);

    const fullRideData = { ...rideData, ...updateData, id: rideId };

    try {
      switch (status) {
        case "accepted":
          await NotificationService.notifyRideAccepted(
            fullRideData,
            additionalData
          );
          break;

        case "arrived":
          await NotificationService.notifyDriverArrived(
            fullRideData,
            additionalData
          );
          break;

        case "in_progress":
          await NotificationService.notifyTripStarted(
            fullRideData,
            additionalData
          );
          break;

        case "completed":
          const rideDataForReceipt = {
            ...fullRideData,
            createdAt:
              fullRideData.createdAt?.toDate?.() ||
              new Date(fullRideData.createdAt || Date.now()),
            completedAt: fullRideData.completedAt?.toDate?.() || new Date(),
            startedAt:
              fullRideData.startedAt?.toDate?.() ||
              fullRideData.acceptedAt?.toDate?.() ||
              new Date(),
            acceptedAt:
              fullRideData.acceptedAt?.toDate?.() ||
              new Date(fullRideData.acceptedAt || Date.now()),
          };

          const receipt = ReceiptService.generateReceipt(rideDataForReceipt);

          // ✅ Payment capture happens automatically via Cloud Function
          // No manual capture needed - onRideStatusChangev2 handles it
          console.log("💳 Payment will be processed by Cloud Function");

          if (
            fullRideData.paymentMethod?.id === "venmo" ||
            fullRideData.paymentMethod?.id === "cashapp" ||
            fullRideData.paymentMethod?.id === "paypal"
          ) {
            console.log(
              `📱 ${fullRideData.paymentMethod.id} payment link will be sent via SMS`
            );
            additionalData.paymentRequestSent = true;
            additionalData.paymentStatus = "request_sent";
          } else if (fullRideData.paymentMethod?.id === "cash") {
            console.log("💰 Cash payment - driver collects");
            additionalData.paymentStatus = "pending_collection";
          }

          await NotificationService.notifyTripCompleted(
            rideDataForReceipt,
            additionalData,
            receipt
          );

          console.log("📄 Receipt Generated:");
          console.log("═══════════════════════════════");
          console.log(ReceiptService.formatReceiptText(receipt));
          break;
      }
    } catch (notificationError) {
      console.error(
        "⚠️ Notification failed (ride updated successfully):",
        notificationError
      );
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error updating ride status:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

export async function deleteRide(rideId) {
  try {
    console.log(`🗑️ Deleting ride ${rideId}`);

    const rideRef = doc(db, "rides", rideId);
    const rideDoc = await getDoc(rideRef);

    if (!rideDoc.exists()) {
      console.warn(`⚠️ Ride ${rideId} already deleted`);
      return { success: true, alreadyDeleted: true };
    }

    await deleteDoc(rideRef);
    console.log(`✅ Ride ${rideId} deleted successfully`);

    return { success: true };
  } catch (error) {
    console.error("❌ Error deleting ride:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

export async function cancelRide(rideId, reason = "Cancelled by driver") {
  try {
    console.log(`🚫 Cancelling ride ${rideId}`);

    const rideRef = doc(db, "rides", rideId);
    const rideDoc = await getDoc(rideRef);

    if (!rideDoc.exists()) {
      console.warn(`⚠️ Ride ${rideId} does not exist`);
      return {
        success: false,
        error: "Ride not found",
        code: "not-found",
      };
    }

    const rideData = rideDoc.data();

    const result = await updateRideStatus(rideId, "cancelled", {
      cancelledBy: DRIVER_ID,
      cancelledAt: Timestamp.now(),
      cancelReason: reason,
    });

    if (rideData.customerPhone) {
      try {
        await SMSService.notifyTripCancelled(rideData.customerPhone, reason);
        console.log("📱 Cancellation SMS sent to customer");
      } catch (smsError) {
        console.error("Failed to send cancellation SMS:", smsError);
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Error cancelling ride:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
    };
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

export function getCurrentDriverId() {
  return DRIVER_ID;
}
