import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";

// SMS Templates
const SMS_TEMPLATES = {
  onTheWay: (driverName, eta) =>
    `Your driver ${driverName} is on the way and will arrive in approximately ${eta} minutes.`,
  arrived: (driverName, vehicleInfo) =>
    `Your driver ${driverName} has arrived. Look for ${vehicleInfo}.`,
  pickedUp: (driverName, destination) =>
    `You have been picked up by ${driverName}. Heading to ${destination}.`,
  completed: (driverName, price) =>
    `Your ride with ${driverName} is complete. Total fare: $${price}. Thank you for choosing our service!`,
};

// Placeholder SMS function - replace with actual SMS service
const sendSMS = async (phoneNumber, message) => {
  console.log(`SMS to ${phoneNumber}: ${message}`);
  // TODO: Implement actual SMS service (Twilio, etc.)
};

// Create a new ride request
export async function createRideRequest(rideData) {
  try {
    const docRef = await addDoc(collection(db, "rides"), {
      customerName: rideData.customerName,
      customerPhone: rideData.customerPhone,
      pickupAddress: rideData.pickupAddress,
      destinationAddress: rideData.destinationAddress,
      pickupCoords: rideData.pickupCoords,
      destinationCoords: rideData.destinationCoords,
      estimatedPrice: rideData.estimatedPrice,
      distance: rideData.distance,
      estimatedTime: rideData.estimatedTime,
      status: "pending", // pending, accepted, picked_up, completed, cancelled
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating ride request:", error);
    throw error;
  }
}

// Listen for ride status updates
export function subscribeToRideUpdates(rideId, callback) {
  const rideRef = doc(db, "rides", rideId);
  return onSnapshot(rideRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
}

// Update ride status (for driver app)
export async function updateRideStatus(rideId, status, driverData = {}) {
  try {
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, {
      status,
      updatedAt: new Date(),
      ...driverData,
    });
  } catch (error) {
    console.error("Error updating ride status:", error);
    throw error;
  }
}

// Listen for new ride requests (for driver app)
export function subscribeToNewRides(callback) {
  const q = query(
    collection(db, "rides"),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const rides = [];
    querySnapshot.forEach((doc) => {
      rides.push({ id: doc.id, ...doc.data() });
    });
    callback(rides);
  });
}

// Add to firebaseService.js

// Update ride status and send SMS notification
export async function updateRideStatusWithNotification(
  rideId,
  status,
  driverData = {}
) {
  try {
    const rideRef = doc(db, "rides", rideId);

    // Update the ride status
    await updateDoc(rideRef, {
      status,
      updatedAt: new Date(),
      ...driverData,
    });

    // Get the updated ride data for SMS
    const rideDoc = await getDoc(rideRef);
    const rideData = rideDoc.data();

    // Send SMS notification based on status
    if (rideData.customerPhone) {
      let message = "";

      switch (status) {
        case "driver_on_way":
          message = SMS_TEMPLATES.onTheWay(
            driverData.driverName || "Your driver",
            driverData.eta || "10"
          );
          break;
        case "driver_arrived":
          message = SMS_TEMPLATES.arrived(
            driverData.driverName || "Your driver",
            driverData.vehicleInfo || "your ride"
          );
          break;
        case "picked_up":
          message = SMS_TEMPLATES.pickedUp(
            driverData.driverName || "Your driver",
            rideData.destinationAddress.split(",")[0]
          );
          break;
        case "completed":
          message = SMS_TEMPLATES.completed(
            driverData.driverName || "Your driver",
            rideData.estimatedPrice
          );
          break;
      }

      if (message) {
        await sendSMS(rideData.customerPhone, message);
      }
    }

    return true;
  } catch (error) {
    console.error("Error updating ride status:", error);
    throw error;
  }
}

// Get ride details for driver
export async function getRideDetails(rideId) {
  try {
    const rideRef = doc(db, "rides", rideId);
    const rideDoc = await getDoc(rideRef);

    if (rideDoc.exists()) {
      return { id: rideDoc.id, ...rideDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting ride details:", error);
    throw error;
  }
}
