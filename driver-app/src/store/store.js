import { configureStore, createSlice } from "@reduxjs/toolkit";

// Helper function to serialize Firebase data for Redux
const serializeRideData = (rides) => {
  return rides.map((ride) => ({
    ...ride,
    createdAt: ride.createdAt?.toDate?.()?.toISOString() || ride.createdAt,
    updatedAt: ride.updatedAt?.toDate?.()?.toISOString() || ride.updatedAt,
    acceptedAt: ride.acceptedAt?.toDate?.()?.toISOString() || ride.acceptedAt,
    completedAt:
      ride.completedAt?.toDate?.()?.toISOString() || ride.completedAt,
    scheduledDateTime:
      typeof ride.scheduledDateTime === "string"
        ? ride.scheduledDateTime
        : ride.scheduledDateTime?.toDate?.()?.toISOString() ||
          ride.scheduledDateTime,
  }));
};

const rideSlice = createSlice({
  name: "rides",
  initialState: {
    newRides: [],
    activeRides: [],
    completedRides: [],
    isOnline: false,
    driverLocation: null,
    earnings: {
      today: 0,
      week: 0,
      month: 0,
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
  },
});

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
  updateRideStatus,
} = rideSlice.actions;

export const store = configureStore({
  reducer: {
    rides: rideSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "rides/setNewRides",
          "rides/setActiveRides",
        ],
        ignoredPaths: ["register", "rides"],
      },
    }),
});
