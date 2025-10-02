/* eslint-disable no-unused-vars */
import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export const auth = getAuth();

export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
};

export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          callback(userDoc.data());
        } else {
          callback({ uid: user.uid, email: user.email, name: "User" });
        }
      } catch (error) {
        callback({ uid: user.uid, email: user.email, name: "User" });
      }
    } else {
      callback(null);
    }
  });
};

export const createUserAccount = async (email, password, userData) => {
  try {
    console.log("Creating user with:", email, userData.name);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userDoc = {
      uid: user.uid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      createdAt: serverTimestamp(),
      totalRides: 0,
      favorites: [],
      recentLocations: [],
    };

    await setDoc(doc(db, "users", user.uid), userDoc);
    console.log("User profile created successfully");
    return { success: true, user: userDoc };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
};

export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: { uid: userCredential.user.uid, email, name: "User" },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create a new ride request
export async function createRideRequest(rideData) {
  try {
    const completeRideData = {
      customerName: rideData.customerName,
      passengerName: rideData.customerName,
      customerPhone: rideData.customerPhone,
      customerEmail: rideData.customerEmail || null,
      customerId: rideData.customerId || null,

      pickupAddress: rideData.pickupAddress,
      pickupLocation: rideData.pickupAddress,
      destinationAddress: rideData.destinationAddress,
      destination: rideData.destinationAddress,

      pickupCoords: rideData.pickupCoords,
      destinationCoords: rideData.destinationCoords,
      pickup: {
        latitude: rideData.pickupCoords.lat,
        longitude: rideData.pickupCoords.lng,
        address: rideData.pickupAddress,
      },
      dropoff: {
        latitude: rideData.destinationCoords.lat,
        longitude: rideData.destinationCoords.lng,
        address: rideData.destinationAddress,
      },

      estimatedPrice: rideData.estimatedPrice,
      estimatedFare: rideData.estimatedPrice,
      fare: rideData.estimatedPrice,
      distance: rideData.distance,
      estimatedTime: rideData.estimatedTime,

      passengerRating: 5.0,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      isScheduled: rideData.isScheduled || false,
      scheduledDateTime: rideData.scheduledDateTime || null,
      paymentMethod: rideData.paymentMethod || null,
      isGuest: rideData.isGuest || false,
    };

    const docRef = await addDoc(collection(db, "rides"), completeRideData);
    console.log("✅ Ride created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating ride:", error);
    throw error;
  }
}

// Subscribe to ride updates - REAL-TIME
export function subscribeToRideUpdates(rideId, callback) {
  console.log("📡 Subscribing to ride updates:", rideId);

  const rideRef = doc(db, "rides", rideId);

  const unsubscribe = onSnapshot(
    rideRef,
    (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = { id: docSnapshot.id, ...docSnapshot.data() };
        console.log("🔄 Ride update received:", data.status);
        callback(data);
      } else {
        console.warn("⚠️ Ride deleted from Firebase:", rideId);
        callback(null);
      }
    },
    (error) => {
      console.error("❌ Error in ride subscription:", error);
      callback(null);
    }
  );

  return unsubscribe;
}

// Get ride details once (for initial load)
export async function getRideDetails(rideId) {
  try {
    console.log("📥 Fetching ride details:", rideId);
    const rideRef = doc(db, "rides", rideId);
    const rideDoc = await getDoc(rideRef);

    if (rideDoc.exists()) {
      const data = { id: rideDoc.id, ...rideDoc.data() };
      console.log("✅ Ride details fetched:", data.status);
      return data;
    }
    console.warn("⚠️ Ride not found:", rideId);
    return null;
  } catch (error) {
    console.error("❌ Error getting ride details:", error);
    throw error;
  }
}

// Update ride status
export async function updateRideStatus(rideId, status, additionalData = {}) {
  try {
    console.log("📝 Updating ride status:", rideId, "->", status);
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, {
      status,
      updatedAt: serverTimestamp(),
      ...additionalData,
    });
    console.log("✅ Ride status updated successfully");
  } catch (error) {
    console.error("❌ Error updating ride status:", error);
    throw error;
  }
}
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("✅ User signed out successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Error signing out:", error);
    return { success: false, error: error.message };
  }
};
