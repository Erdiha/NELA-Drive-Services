/* eslint-disable no-unused-vars */
// STEP 1 FIX: Improved Firebase Auth integration
// Removed localStorage dependencies, cleaner auth flow

import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

export const auth = getAuth();

// FIXED: Cleaner auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Get full user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userDoc.data(),
          };
          console.log("User profile loaded:", userData.name);
          callback(userData);
        } else {
          // Fallback if Firestore doc doesn't exist
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: "User",
          });
        }
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Still provide basic user info
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: "User",
        });
      }
    } else {
      callback(null);
    }
  });
};

// FIXED: Improved account creation with better error handling
export const createUserAccount = async (email, password, userData) => {
  try {
    console.log("Creating account for:", email);

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Create Firestore profile with all user data
    const userProfile = {
      uid: user.uid,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      createdAt: new Date(),
      totalRides: 0,
      totalSaved: 0,
      avgRating: 5.0,
      favorites: [],
      recentLocations: [],
    };

    // Save to Firestore using UID as document ID
    await setDoc(doc(db, "users", user.uid), userProfile);

    console.log("Account created successfully:", user.uid);
    return { success: true, user: userProfile };
  } catch (error) {
    console.error("Error creating account:", error);

    // User-friendly error messages
    let errorMessage = error.message;
    if (error.code === "auth/email-already-in-use") {
      errorMessage =
        "This email is already registered. Try signing in instead.";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Password should be at least 6 characters.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Invalid email address.";
    }

    return { success: false, error: errorMessage };
  }
};

// FIXED: Improved sign-in with full user data retrieval
export const signInUser = async (email, password) => {
  try {
    console.log("Signing in:", email);

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Get full user profile from Firestore
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

    if (userDoc.exists()) {
      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        ...userDoc.data(),
      };
      console.log("Sign in successful:", userData.name);
      return { success: true, user: userData };
    } else {
      // User exists in Auth but not in Firestore (shouldn't happen)
      console.warn("User authenticated but no Firestore profile found");
      return {
        success: true,
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: "User",
        },
      };
    }
  } catch (error) {
    console.error("Error signing in:", error);

    // User-friendly error messages
    let errorMessage = error.message;
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      errorMessage = "Invalid email or password.";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Too many failed attempts. Please try again later.";
    }

    return { success: false, error: errorMessage };
  }
};

// Sign out function
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out");
    return { success: true };
  } catch (error) {
    console.error("Error signing out:", error);
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    });
    console.log("Profile updated successfully");
    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }
};

// Create a new ride request
export async function createRideRequest(rideData) {
  try {
    const completeRideData = {
      // Customer details
      customerName: rideData.customerName,
      passengerName: rideData.customerName,
      customerPhone: rideData.customerPhone,

      // Location details
      pickupAddress: rideData.pickupAddress,
      pickupLocation: rideData.pickupAddress,
      destinationAddress: rideData.destinationAddress,
      destination: rideData.destinationAddress,

      // Coordinate data
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

      // Price and trip details
      estimatedPrice: rideData.estimatedPrice,
      estimatedFare: rideData.estimatedPrice,
      fare: rideData.estimatedPrice,
      distance: rideData.distance,
      estimatedTime: rideData.estimatedTime,

      // Customer rating
      passengerRating: 5.0,

      // Status and timing
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),

      // Scheduled ride support
      isScheduled: rideData.isScheduled || false,
      scheduledDateTime: rideData.scheduledDateTime || null,

      // Payment method
      paymentMethod: rideData.paymentMethod || null,
    };

    const docRef = await addDoc(collection(db, "rides"), completeRideData);
    console.log("Ride request created with ID:", docRef.id);
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

// Update ride status
export async function updateRideStatus(rideId, status, additionalData = {}) {
  try {
    const rideRef = doc(db, "rides", rideId);
    await updateDoc(rideRef, {
      status,
      updatedAt: new Date(),
      ...additionalData,
    });
  } catch (error) {
    console.error("Error updating ride status:", error);
    throw error;
  }
}

// Get ride details
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
