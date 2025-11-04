import { configureStore, createSlice } from "@reduxjs/toolkit";

// ✅ FIXED: Helper function to serialize Firebase data for Redux
const serializeRideData = (rides) => {
  if (!Array.isArray(rides)) {
    rides = [rides];
  }

  return rides.map((ride) => {
    // Helper to convert Firestore Timestamp to ISO string
    const convertTimestamp = (timestamp) => {
      if (!timestamp) return null;
      if (typeof timestamp === "string") return timestamp;
      if (timestamp.toDate) return timestamp.toDate().toISOString();
      if (timestamp.seconds) {
        // Firestore Timestamp object with seconds/nanoseconds
        return new Date(timestamp.seconds * 1000).toISOString();
      }
      return timestamp;
    };

    return {
      ...ride,
      createdAt: convertTimestamp(ride.createdAt),
      updatedAt: convertTimestamp(ride.updatedAt),
      acceptedAt: convertTimestamp(ride.acceptedAt),
      completedAt: convertTimestamp(ride.completedAt),
      scheduledDateTime: convertTimestamp(ride.scheduledDateTime),
      locationUpdatedAt: convertTimestamp(ride.locationUpdatedAt),
      timeoutAt: convertTimestamp(ride.timeoutAt),
      startedAt: convertTimestamp(ride.startedAt),
      cancelledAt: convertTimestamp(ride.cancelledAt),
    };
  });
};

const rideSlice = createSlice({
  name: "rides",
  initialState: {
    newRides: [],
    activeRides: [],
    completedRides: [],
    isOnline: false,
    driverLocation: null,
    incomingRideRequest: null,
    earnings: {
      today: 0,
      week: 0,
      month: 0,
    },
    rating: {
      average: 5.0,
      count: 0,
      reviews: [],
      topCompliments: [],
      lastUpdated: null,
    },
  },
  reducers: {
    setNewRides: (state, action) => {
      state.newRides = serializeRideData(action.payload);
    },
    setActiveRides: (state, action) => {
      state.activeRides = serializeRideData(action.payload);
    },
    addActiveRide: (state, action) => {
      const serializedRide = serializeRideData([action.payload])[0];
      state.activeRides.push(serializedRide);
    },
    removeActiveRide: (state, action) => {
      state.activeRides = state.activeRides.filter(
        (ride) => ride.id !== action.payload
      );
    },
    setCompletedRides: (state, action) => {
      state.completedRides = serializeRideData(action.payload);
    },
    addCompletedRide: (state, action) => {
      const serializedRide = serializeRideData([action.payload])[0];
      state.completedRides.push(serializedRide);
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setDriverLocation: (state, action) => {
      state.driverLocation = action.payload;
    },
    updateEarnings: (state, action) => {
      state.earnings = { ...state.earnings, ...action.payload };
    },
    updateRideStatus: (state, action) => {
      const { rideId, status } = action.payload;

      // Update in active rides
      const activeRideIndex = state.activeRides.findIndex(
        (ride) => ride.id === rideId
      );
      if (activeRideIndex !== -1) {
        state.activeRides[activeRideIndex].status = status;
        state.activeRides[activeRideIndex].updatedAt = new Date().toISOString();
      }
    },
    setDriverRating: (state, action) => {
      state.rating = {
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    },
    // ✅ FIXED: Added both incoming ride actions
    setIncomingRideRequest: (state, action) => {
      state.incomingRideRequest = action.payload;
    },
    clearIncomingRideRequest: (state) => {
      state.incomingRideRequest = null;
    },
  },
});

// ✅ FIXED: Export all actions including the new ones
export const {
  setNewRides,
  setActiveRides,
  addActiveRide,
  removeActiveRide,
  setCompletedRides,
  addCompletedRide,
  setOnlineStatus,
  setDriverLocation,
  updateEarnings,
  setDriverRating,
  updateRideStatus,
  setIncomingRideRequest,
  clearIncomingRideRequest,
} = rideSlice.actions;

export const store = configureStore({
  reducer: {
    rides: rideSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ✅ Ignore these action types completely
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "rides/setNewRides",
          "rides/setActiveRides",
          "rides/addActiveRide",
          "rides/addCompletedRide",
          "rides/setIncomingRideRequest",
          "rides/clearIncomingRideRequest",
        ],
        // ✅ Ignore these paths in state
        ignoredActionPaths: [
          "payload.locationUpdatedAt",
          "payload.timeoutAt",
          "payload.createdAt",
          "payload.updatedAt",
          "payload.acceptedAt",
          "payload.completedAt",
        ],
        ignoredPaths: ["register", "rides"],
      },
    }),
});
