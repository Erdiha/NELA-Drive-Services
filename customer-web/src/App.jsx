/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import AddressInput from "./components/AddressInput";
import { calculateRidePrice } from "./services/pricingService";
import {
  createRideRequest,
  onAuthStateChange,
  subscribeToRideUpdates,
  getRideDetails,
} from "./services/firebaseService";
import ScheduleCalendar from "./components/ScheduleCalender";
import RideStatusTracker from "./components/RideStatusTracker";
import PaymentOptions from "./components/PaymentOptions";
import AccountSystem from "./components/AccountSystem";
import RideTrackingMap from "./components/RideTrackingMap";
import AccountDashboard from "./components/AccountDashboard";
import { sendSMS, SMS_TEMPLATES } from "./services/smsServices";
import RideTrackingPage from "./components/RideTrackingPage";

const GuestAccountPrompt = ({
  customerDetails,
  onAccountCreated,
  onDismiss,
}) => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email =
      customerDetails.email ||
      `${customerDetails.phone.replace(/\D/g, "")}@nela-guest.com`;

    try {
      // Placeholder for account creation - you'll need to implement createUserAccount
      const result = {
        success: true,
        user: {
          name: customerDetails.name,
          email: email,
          phone: customerDetails.phone,
        },
      };

      if (result.success) {
        onAccountCreated(result.user);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Create Account
        </h2>
        <p className="text-gray-600 mb-6">
          Create an account to track your rides and save preferences.
        </p>
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <input
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// NEW: URL Booking Progress Helper Functions
const saveBookingToURL = (bookingData) => {
  const params = new URLSearchParams();

  if (bookingData.pickupAddress) {
    params.set("pickup", JSON.stringify(bookingData.pickupAddress));
  }
  if (bookingData.destinationAddress) {
    params.set("dest", JSON.stringify(bookingData.destinationAddress));
  }
  if (bookingData.priceEstimate) {
    params.set("price", JSON.stringify(bookingData.priceEstimate));
  }
  if (bookingData.customerDetails?.name || bookingData.customerDetails?.phone) {
    params.set("customer", JSON.stringify(bookingData.customerDetails));
  }
  if (bookingData.isScheduled) {
    params.set("scheduled", "true");
    if (bookingData.scheduledDateTime) {
      params.set("schedTime", bookingData.scheduledDateTime);
    }
  }
  if (bookingData.selectedPaymentMethod) {
    params.set("payment", JSON.stringify(bookingData.selectedPaymentMethod));
  }

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
  console.log("💾 Booking progress saved to URL");
};

const restoreBookingFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  const restored = {};

  try {
    if (params.has("pickup")) {
      restored.pickupAddress = JSON.parse(params.get("pickup"));
    }
    if (params.has("dest")) {
      restored.destinationAddress = JSON.parse(params.get("dest"));
    }
    if (params.has("price")) {
      restored.priceEstimate = JSON.parse(params.get("price"));
    }
    if (params.has("customer")) {
      restored.customerDetails = JSON.parse(params.get("customer"));
    }
    if (params.has("scheduled")) {
      restored.isScheduled = true;
      restored.scheduledDateTime = params.get("schedTime");
    }
    if (params.has("payment")) {
      restored.selectedPaymentMethod = JSON.parse(params.get("payment"));
    }

    if (Object.keys(restored).length > 0) {
      console.log("✅ Booking progress restored from URL");
    }
  } catch (error) {
    console.error("Error restoring from URL:", error);
  }

  return restored;
};

const clearBookingFromURL = () => {
  window.history.replaceState({}, "", window.location.pathname);
  console.log("🗑️ Booking progress cleared from URL");
};

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [user, setUser] = useState(null);
  const [pickupAddress, setPickupAddress] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState(null);
  const [priceEstimate, setPriceEstimate] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    phone: "",
  });
  const [isBooking, setIsBooking] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [rideId, setRideId] = useState(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDriverActions, setShowDriverActions] = useState(false);
  const [currentRideStatus, setCurrentRideStatus] = useState("pending");
  const [showRideTracker, setShowRideTracker] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [rideData, setRideData] = useState(null);
  const [showFindingDriver, setShowFindingDriver] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/track/")) {
      const trackingRideId = path.replace("/track/", "");
      setRideId(trackingRideId);
      setCurrentPage("tracking");
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        console.log("User logged in:", user.name);
        setUser(user);
        setCustomerDetails({ name: user.name, phone: user.phone });
      } else {
        console.log("User logged out");
        setUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // REPLACE the entire section after "useEffect(() => {" for ride updates (around line 195)

  useEffect(() => {
    if (!rideId) return;

    console.log("📡 Setting up ride subscription for:", rideId);

    if (!rideData) {
      getRideDetails(rideId).then((data) => {
        if (!data) {
          console.log("❌ Ride not found, clearing state");
          setRideId(null);
          setRideData(null);
          clearBookingFromURL();
          setCurrentPage("home");
          return;
        }

        setRideData(data);
        setCurrentRideStatus(data.status);

        if (data.pickupAddress && !pickupAddress) {
          setPickupAddress({
            address: data.pickupAddress,
            lat: data.pickupCoords?.lat || data.pickup?.latitude,
            lng: data.pickupCoords?.lng || data.pickup?.longitude,
          });
        }
        if (data.destinationAddress && !destinationAddress) {
          setDestinationAddress({
            address: data.destinationAddress,
            lat: data.destinationCoords?.lat || data.dropoff?.latitude,
            lng: data.destinationCoords?.lng || data.dropoff?.longitude,
          });
        }
        if (data.estimatedPrice && !priceEstimate) {
          setPriceEstimate({
            finalPrice: data.estimatedPrice,
            distance: parseFloat(data.distance),
            estimatedTime: parseInt(data.estimatedTime),
          });
        }
      });
    }

    const unsubscribe = subscribeToRideUpdates(rideId, (updatedRide) => {
      if (!updatedRide) {
        console.log("❌ Ride deleted or error, clearing state");
        setRideId(null);
        setRideData(null);
        setPickupAddress(null);
        setDestinationAddress(null);
        setPriceEstimate(null);
        clearBookingFromURL();
        setCurrentPage("home");
        alert("This ride is no longer available");
        return;
      }

      console.log("🔄 Ride update:", updatedRide.status);
      setRideData(updatedRide);
      setCurrentRideStatus(updatedRide.status);

      if (updatedRide.status === "accepted" && showFindingDriver) {
        setShowFindingDriver(false);
      }
    });

    return () => {
      console.log("🔌 Unsubscribing from ride:", rideId);
      unsubscribe();
    };
  }, [rideId]);
  // NEW: Load ride from URL tracking link
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith("/track/")) {
      const trackingRideId = path.replace("/track/", "");
      console.log("📍 Loading ride from tracking URL:", trackingRideId);
      setRideId(trackingRideId);
      setCurrentPage("tracking");
    }
  }, []);
  useEffect(() => {
    const restored = restoreBookingFromURL();

    if (restored.rideId) {
      setRideId(restored.rideId);
      setCurrentPage("tracking");
    }

    if (restored.pickupAddress) setPickupAddress(restored.pickupAddress);
    if (restored.destinationAddress)
      setDestinationAddress(restored.destinationAddress);
    if (restored.priceEstimate) setPriceEstimate(restored.priceEstimate);
    if (restored.customerDetails) setCustomerDetails(restored.customerDetails);
    if (restored.isScheduled !== undefined)
      setIsScheduled(restored.isScheduled);
    if (restored.scheduledDateTime)
      setScheduledDateTime(restored.scheduledDateTime);
    if (restored.selectedPaymentMethod)
      setSelectedPaymentMethod(restored.selectedPaymentMethod);
  }, []);

  // Save booking progress AND active ride to URL
  useEffect(() => {
    if (currentPage === "tracking" && rideId) {
      saveBookingToURL({ rideId });
    } else if (
      currentPage === "home" &&
      priceEstimate &&
      pickupAddress &&
      destinationAddress
    ) {
      saveBookingToURL({
        pickupAddress,
        destinationAddress,
        priceEstimate,
        customerDetails,
        isScheduled,
        scheduledDateTime,
        selectedPaymentMethod,
      });
    } else {
      clearBookingFromURL();
    }
  }, [rideId, pickupAddress, destinationAddress, priceEstimate, currentPage]);
  useEffect(() => {
    const restored = restoreBookingFromURL();

    if (restored.rideId) {
      // Verify ride exists in Firebase before restoring
      getRideDetails(restored.rideId).then((ride) => {
        if (ride) {
          setRideId(restored.rideId);
          setCurrentPage("tracking");
        } else {
          console.log("Ride in URL doesn't exist, clearing");
          clearBookingFromURL();
        }
      });
    }

    if (restored.pickupAddress) setPickupAddress(restored.pickupAddress);
    if (restored.destinationAddress)
      setDestinationAddress(restored.destinationAddress);
    if (restored.priceEstimate) setPriceEstimate(restored.priceEstimate);
    if (restored.customerDetails) setCustomerDetails(restored.customerDetails);
    if (restored.isScheduled !== undefined)
      setIsScheduled(restored.isScheduled);
    if (restored.scheduledDateTime)
      setScheduledDateTime(restored.scheduledDateTime);
    if (restored.selectedPaymentMethod)
      setSelectedPaymentMethod(restored.selectedPaymentMethod);
  }, []);

  // NEW: Save booking progress to URL whenever it changes
  useEffect(() => {
    if (
      currentPage === "home" &&
      (pickupAddress || destinationAddress || priceEstimate)
    ) {
      saveBookingToURL({
        pickupAddress,
        destinationAddress,
        priceEstimate,
        customerDetails,
        isScheduled,
        scheduledDateTime,
        selectedPaymentMethod,
      });
    }
  }, [
    pickupAddress,
    destinationAddress,
    priceEstimate,
    customerDetails,
    isScheduled,
    scheduledDateTime,
    selectedPaymentMethod,
    currentPage,
  ]);

  const handleLogin = (userData) => {
    console.log("handleLogin called with:", userData);
    setUser(userData);
    if (userData) {
      setCustomerDetails({ name: userData.name, phone: userData.phone });
    }
    setCurrentPage("home");
  };

  const handleLogout = () => {
    console.log("Logging out");
    setUser(null);
    setCustomerDetails({ name: "", phone: "" });
    setCurrentPage("home");
  };

  const resetBookingFlow = () => {
    setPickupAddress(null);
    setDestinationAddress(null);
    setPriceEstimate(null);
    setShowBookingForm(false);
    setShowPaymentOptions(false);
    setSelectedPaymentMethod(null);
    setBookingComplete(false);
    setShowRideTracker(false);
    setRideId(null);
    setRideData(null);
    setShowFindingDriver(false);
    setCurrentRideStatus("pending");
    if (!user) {
      setCustomerDetails({ name: "", phone: "" });
    }
    clearBookingFromURL(); // NEW: Clear URL
    setCurrentPage("home");
  };

  const handleGetEstimate = async (e) => {
    e.preventDefault();
    if (pickupAddress && destinationAddress) {
      const estimate = await calculateRidePrice(
        { lat: pickupAddress.lat, lng: pickupAddress.lng },
        { lat: destinationAddress.lat, lng: destinationAddress.lng }
      );
      setPriceEstimate(estimate);
    } else {
      alert("Please select both pickup and destination addresses");
    }
  };

  const handleBookRide = () => {
    setShowPaymentOptions(true);
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setShowPaymentOptions(false);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!customerDetails.name || !customerDetails.phone) {
      alert("Please fill in your name and phone number");
      return;
    }

    setIsBooking(true);

    try {
      const rideData = {
        customerName: customerDetails.name,
        customerPhone: customerDetails.phone,
        customerEmail: user?.email || null,
        customerId: user?.uid || null,
        pickupAddress: pickupAddress.address,
        destinationAddress: destinationAddress.address,
        pickupCoords: { lat: pickupAddress.lat, lng: pickupAddress.lng },
        destinationCoords: {
          lat: destinationAddress.lat,
          lng: destinationAddress.lng,
        },
        estimatedPrice: priceEstimate.finalPrice,
        distance: `${priceEstimate.distance} miles`,
        estimatedTime: `${priceEstimate.estimatedTime} min`,
        isScheduled: isScheduled,
        scheduledDateTime: isScheduled ? scheduledDateTime : null,
        paymentMethod: selectedPaymentMethod,
        isGuest: !user,
      };

      const newRideId = await createRideRequest(rideData);
      setRideId(newRideId);

      try {
        const trackingUrl = `${window.location.origin}/track/${newRideId}`;
        await sendSMS(
          customerDetails.phone,
          SMS_TEMPLATES.rideBooked(trackingUrl)
        );
      } catch (smsError) {
        console.error("SMS failed but ride booked:", smsError);
      }

      setBookingComplete(true);
      setCurrentPage("tracking");
      clearBookingFromURL(); // NEW: Clear URL after booking

      if (!isScheduled) {
        setShowFindingDriver(true);
      } else {
        const rideTime = new Date(scheduledDateTime);
        const now = new Date();
        const hoursUntilRide = (rideTime - now) / (1000 * 60 * 60);
        if (hoursUntilRide <= 1) {
          setShowFindingDriver(true);
        }
      }

      if (!user) {
        setTimeout(() => {
          setShowGuestPrompt(true);
        }, 3000);
      }
    } catch (error) {
      alert("Error booking ride. Please try again.");
      console.error("Booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const FindingDriverModal = () => {
    const shouldShowModal = () => {
      if (!showFindingDriver) return false;
      if (!isScheduled) return true;
      const rideTime = new Date(scheduledDateTime);
      const now = new Date();
      const hoursUntilRide = (rideTime - now) / (1000 * 60 * 60);
      return hoursUntilRide <= 1;
    };

    return shouldShowModal() ? (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Finding Your Driver
          </h2>
          <p className="text-gray-600 mb-6">
            We're connecting you with a nearby driver...
          </p>
          <button
            onClick={() => setShowFindingDriver(false)}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Hide
          </button>
        </div>
      </div>
    ) : null;
  };

  const getRideStatusDisplay = () => {
    if (!rideData) {
      return isScheduled
        ? {
            title: "Request Sent",
            message:
              "We'll notify you when a driver accepts your scheduled ride",
          }
        : {
            title: "Looking for Driver",
            message: "Finding you a nearby driver...",
          };
    }

    switch (rideData.status) {
      case "pending":
        if (isScheduled) {
          const rideTime = new Date(scheduledDateTime);
          const now = new Date();
          const hoursUntilRide = (rideTime - now) / (1000 * 60 * 60);
          if (hoursUntilRide > 1) {
            return {
              title: "Ride Scheduled",
              message: "We'll find you a driver closer to your ride time",
            };
          } else {
            return {
              title: "Looking for Driver",
              message: "Finding you a driver for your scheduled ride...",
            };
          }
        }
        return {
          title: "Looking for Driver",
          message: "Finding you a nearby driver...",
        };
      case "accepted":
        return {
          title: "Ride Confirmed",
          message: "Your driver is heading to pickup location",
        };
      case "arrived":
        return {
          title: "Driver Arrived",
          message: "Your driver is waiting at pickup location",
        };
      case "in_progress":
        return {
          title: "Trip in Progress",
          message: "On your way to destination",
        };
      case "completed":
        return { title: "Trip Completed", message: "You have arrived safely!" };
      default:
        return { title: "Processing", message: "Please wait..." };
    }
  };

  const NavigationHeader = () => (
    <div className="fixed top-0 left-0 right-0 z-40">
      <div className="bg-transparent backdrop-blur-xl border-b border-neutral-100/50 shadow-sm w-full">
        <div className="mx-auto px-6 py-4 max-w-md md:max-w-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage("home")}
              className="flex items-center space-x-2 group"
            >
              <div className="w-10 h-10 icon-brand rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white text-lg font-bold">N</span>
              </div>
              <span className="text-xl text-brand">NELA</span>
            </button>

            <div className="flex items-center space-x-3">
              {user ? (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">
                      {user.name}
                    </p>
                    <p className="text-xs text-neutral-500">Member</p>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setCurrentPage("account")}
                      type="button"
                      className="w-8 h-8 bg-gradient-to-r from-danger to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-medium hover:shadow-lg transition-all duration-300"
                    >
                      {user.name.charAt(0)}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCurrentPage("account")}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>

          <div className="flex mt-4 space-x-1">
            {[
              { key: "home", label: "Book" },
              ...(user ? [{ key: "account", label: "Account" }] : []),
              { key: "tracking", label: "Track" },
            ].map((page) => (
              <button
                key={page.key}
                onClick={() => setCurrentPage(page.key)}
                className={`h-8 flex-1 rounded-full transition-all duration-500 flex items-center justify-center text-xs font-medium ${
                  currentPage === page.key
                    ? "bg-brand text-white shadow-lg"
                    : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (currentPage === "account") {
    return (
      <div className="min-h-screen bg-light h-full w-full flex justify-center items-center">
        <NavigationHeader />
        <div className="pt-24 px-4 min-h-screen w-full min-w-[90%] h-full justify-center flex items-center">
          {user ? (
            <AccountDashboard
              user={user}
              setCurrentPage={setCurrentPage}
              onLogout={handleLogout}
              onUpdateProfile={(updatedUser) => {
                setUser(updatedUser);
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-full">
              <div className="w-full max-w-md">
                <div className="card-glass p-8">
                  <AccountSystem
                    onLogin={handleLogin}
                    onSkip={() => setCurrentPage("home")}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (currentPage === "tracking") {
    if (!rideId) {
      return (
        <div className="min-h-screen bg-light">
          <NavigationHeader />
          <div className="pt-24 px-4 min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md text-center card-glass p-8">
              <div className="text-4xl mb-4">🚗</div>
              <h2 className="text-2xl font-bold mb-4">No Active Rides</h2>
              <p className="text-gray-600 mb-6">Book a ride to track it here</p>
              <button
                onClick={() => setCurrentPage("home")}
                className="btn-primary w-full"
              >
                Book a Ride
              </button>
            </div>
          </div>
        </div>
      );
    }
    return (
      <RideTrackingPage
        rideData={rideData}
        pickupAddress={pickupAddress}
        destinationAddress={destinationAddress}
        priceEstimate={priceEstimate}
        rideId={rideId}
        onBookAnother={resetBookingFlow}
        isScheduled={isScheduled}
        scheduledDateTime={scheduledDateTime}
      />
    );
  }
  return (
    <div className="min-h-screen bg-light">
      <NavigationHeader />

      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md card-glass p-8 transform animate-in fade-in zoom-in duration-300">
            <PaymentOptions
              totalFare={parseFloat(priceEstimate.finalPrice)}
              onPaymentSelect={handlePaymentMethodSelect}
              driverInfo={{
                venmo: "nela-driver",
                phone: "(555) 123-4567",
                cashapp: "NELADriver",
              }}
            />
            <button
              onClick={() => setShowPaymentOptions(false)}
              className="w-full mt-6 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-3 px-4 rounded-2xl transition-all duration-300 font-medium"
            >
              ← Back to Pricing
            </button>
          </div>
        </div>
      )}

      {showBookingForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md card-glass p-8 transform animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <h2 className="text-2xl text-brand mb-2">Complete Booking</h2>
              <p className="text-neutral-600">Just a few details to finish</p>
            </div>

            <form onSubmit={handleSubmitBooking} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customerDetails.name}
                    onChange={(e) =>
                      setCustomerDetails({
                        ...customerDetails,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-4 bg-neutral-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-300 text-neutral-900 placeholder-neutral-500"
                    placeholder="Enter your full name"
                    required
                  />
                  {!user && (
                    <p className="text-xs text-gray-500 mt-2">
                      💡 No account needed - book as guest!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-3">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({
                        ...customerDetails,
                        phone: e.target.value,
                      })
                    }
                    className="w-full px-4 py-4 bg-neutral-50 border-0 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white transition-all duration-300 text-neutral-900 placeholder-neutral-500"
                    placeholder="(555) 123-4567"
                    required
                  />
                  {!user && (
                    <p className="text-xs text-gray-500 mt-2">
                      📱 We'll send ride updates to this number
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-2xl p-6">
                <h3 className="font-semibold text-neutral-800 mb-4">
                  Trip Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Total Fare</span>
                    <span className="font-bold text-2xl text-success">
                      ${priceEstimate.finalPrice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-600">Payment Method</span>
                    <span className="font-medium text-primary">
                      {selectedPaymentMethod?.name}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="text-xs text-neutral-500 space-y-1">
                      <p>
                        <span className="font-medium">From:</span>{" "}
                        {pickupAddress.address.split(",")[0]}...
                      </p>
                      <p>
                        <span className="font-medium">To:</span>{" "}
                        {destinationAddress.address.split(",")[0]}...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-4 px-6 rounded-2xl transition-all duration-300 font-medium"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="flex-2 btn-accent disabled:opacity-50 disabled:transform-none"
                >
                  {isBooking ? "Booking..." : "Confirm Ride"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="pt-24 px-4 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md lg:max-w-lg">
          <div className="card-glass p-8">
            <div className="text-center mb-10">
              <h1 className="md:text-4xl text-2xl font-bold text-brand mb-3">
                NELA Rides
              </h1>
              <p className="text-neutral-600 md:text-lg font-medium">
                Each Drive Is as Good as The last One.
              </p>
              {user ? (
                <div className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-50 to-amber-50 rounded-2xl inline-block border border-purple-100">
                  <p className="text-primary font-medium">
                    Welcome back, {user.name}! 👋
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Your info is already saved ✓
                  </p>
                </div>
              ) : (
                <div className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl inline-block border border-blue-100">
                  <p className="text-sm text-gray-700">
                    🚀 <span className="font-semibold">Book in seconds</span> -
                    No account needed!
                  </p>
                </div>
              )}
            </div>

            {!priceEstimate ? (
              <form onSubmit={handleGetEstimate} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-4 flex items-center">
                      Pickup Location
                    </label>
                    <AddressInput
                      placeholder="Enter the pick up location"
                      onAddressSelect={setPickupAddress}
                      icon={<span className="text-xl">🚗</span>}
                      showCurrentLocation={true}
                      currentUser={user}
                      isPickup={true}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-4 flex items-center">
                      Destination
                    </label>
                    <AddressInput
                      placeholder="Enter the destination"
                      onAddressSelect={setDestinationAddress}
                      icon={<span className="text-xl">🎯</span>}
                      showCurrentLocation={false}
                      currentUser={user}
                      isPickup={false}
                    />
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-amber-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isScheduled}
                          onChange={(e) => setIsScheduled(e.target.checked)}
                          className="w-5 h-5 text-primary rounded focus:ring-primary"
                        />
                        <span className="text-sm font-semibold text-neutral-700">
                          Schedule for later
                        </span>
                      </label>
                      <span className="text-2xl">⏰</span>
                    </div>

                    {isScheduled && (
                      <button
                        type="button"
                        onClick={() => setShowCalendar(true)}
                        className="w-full px-4 py-4 bg-white border border-purple-200 rounded-xl hover:border-purple-300 focus:border-primary focus:ring-2 focus:ring-purple-200 transition-all duration-300 text-left flex items-center justify-between group mt-4"
                      >
                        <span
                          className={
                            scheduledDateTime
                              ? "text-neutral-800 font-medium"
                              : "text-neutral-500"
                          }
                        >
                          {scheduledDateTime
                            ? new Date(scheduledDateTime).toLocaleString()
                            : "Select date and time"}
                        </span>
                        <svg
                          className="w-5 h-5 text-primary group-hover:text-primary-light transition-colors duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <span>Get An Estimate</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl md:p-6 p-3 border border-cyan-200">
                  <div className="flex items-start space-x-3">
                    <div className="text-accent md:text-2xl">🛡️</div>
                    <div>
                      <p className="font-semibold text-accent-dark mb-2">
                        Price Match Guarantee
                      </p>
                      <p className="text-sm text-cyan-800">
                        We'll match any competitor's price and apply 15%
                        discount. Show your driver the current Uber/Lyft rate if
                        needed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-2xl md:p-6 p-3">
                  <h3 className="md:text-lg text-md font-bold text-neutral-800 mb-6 flex items-center">
                    <span className="text-2xl mr-2">🚗</span>Trip Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="md:text-2xl text-lg font-bold text-primary">
                        {priceEstimate.distance}
                      </p>
                      <p className="text-sm text-neutral-600 font-medium">
                        Miles
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="md:text-2xl text-lg font-bold text-secondary">
                        {priceEstimate.estimatedTime}
                      </p>
                      <p className="text-sm text-neutral-600 font-medium">
                        Minutes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-2xl md:p-8 p-4 border border-emerald-200">
                  <div className="text-center">
                    <p className="text-lg md:text-xl text-neutral-600 mb-2">
                      Trip Total
                    </p>
                    <p className="md:text-5xl text-4xl font-bold bg-gradient-to-r from-success to-accent bg-clip-text text-transparent mb-3">
                      ${priceEstimate.finalPrice}
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-emerald-100 rounded-full">
                      <span className="text-emerald-800 font-semibold text-sm">
                        💰 You save ${priceEstimate.savings} (15% off)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setPriceEstimate(null);
                      setPickupAddress(null);
                      setDestinationAddress(null);
                    }}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 py-4 px-6 rounded-2xl transition-all duration-300 font-medium"
                  >
                    ← Edit Trip
                  </button>
                  <button
                    onClick={handleBookRide}
                    className="flex-2 btn-accent flex items-center justify-center space-x-2"
                  >
                    <span>Book the Ride</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showGuestPrompt && (
        <GuestAccountPrompt
          customerDetails={customerDetails}
          onAccountCreated={(newUser) => {
            console.log("Guest created account:", newUser);
            setUser(newUser);
            setShowGuestPrompt(false);
          }}
          onDismiss={() => {
            setShowGuestPrompt(false);
            console.log("Guest dismissed account creation");
          }}
        />
      )}

      <ScheduleCalendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDateTime={(dateTime) => {
          setScheduledDateTime(dateTime.toISOString().slice(0, 16));
          setShowCalendar(false);
        }}
        minDateTime={new Date(Date.now() + 3600000)}
      />
    </div>
  );
}

export default App;
