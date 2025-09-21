import React, { useState } from "react";
import AddressInput from "./components/AddressInput";
import { calculateRidePrice } from "./services/pricingService";
import { createRideRequest } from "./services/firebaseService";
import ScheduleCalendar from "./components/ScheduleCalender";

function App() {
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

  // const [availableSlots, setAvailableSlots] = useState([]);

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
        pickupAddress: pickupAddress.address,
        destinationAddress: destinationAddress.address,
        pickupCoords: { lat: pickupAddress.lat, lng: pickupAddress.lng },
        destinationCoords: {
          lat: destinationAddress.lat,
          lng: destinationAddress.lng,
        },
        estimatedPrice: priceEstimate.finalPrice,
        distance: priceEstimate.distance,
        estimatedTime: priceEstimate.estimatedTime,
      };

      const newRideId = await createRideRequest(rideData);
      setRideId(newRideId);
      setBookingComplete(true);
    } catch (error) {
      alert("Error booking ride. Please try again.");
      console.error("Booking error:", error);
    } finally {
      setIsBooking(false);
    }
  };

  const resetForm = () => {
    setPickupAddress(null);
    setDestinationAddress(null);
    setPriceEstimate(null);
    setShowBookingForm(false);
    setCustomerDetails({ name: "", phone: "" });
    setBookingComplete(false);
    setRideId(null);
  };

  if (bookingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Ride Requested!
          </h2>
          <p className="text-gray-600 mb-2">
            Your ride has been sent to the driver.
          </p>
          <p className="text-sm text-gray-500 mb-6">Ride ID: {rideId}</p>
          <p className="text-sm text-blue-600 mb-6">
            You'll receive a call from your driver shortly.
          </p>

          <button
            onClick={resetForm}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-2xl hover:bg-blue-700 transition-all duration-200 mb-4"
          >
            Book Another Ride
          </button>

          {/* ADD THIS NEW SECTION: */}
          <button
            onClick={() => setShowDriverActions(!showDriverActions)}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-2xl hover:bg-gray-700 transition-all duration-200"
          >
            {showDriverActions
              ? "Hide Driver Actions"
              : "Show Driver Actions (Testing)"}
          </button>

          {showDriverActions && rideId && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl">
              <DriverActions
                rideId={rideId}
                currentStatus={currentRideStatus}
                onStatusUpdate={setCurrentRideStatus}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showBookingForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Complete Your Booking
          </h2>

          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Name
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                placeholder="(555) 123-4567"
                required
              />
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <div className="flex justify-between mb-2">
                <span>Total:</span>
                <span className="font-bold">${priceEstimate.finalPrice}</span>
              </div>
              <div className="text-gray-600 text-xs">
                From: {pickupAddress.address.split(",")[0]}...
                <br />
                To: {destinationAddress.address.split(",")[0]}...
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-2xl hover:bg-gray-300 transition-all duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isBooking}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-2xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
              >
                {isBooking ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg bg-white rounded-3xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🚗</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
            NELA Drive Services
          </h1>
          <p className="text-gray-600 text-lg">
            Premium rides at your fingertips
          </p>
        </div>

        {!priceEstimate ? (
          /* Booking Form */
          <form onSubmit={handleGetEstimate} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Pickup Location
                </label>
                <AddressInput
                  placeholder="Enter pickup address"
                  onAddressSelect={setPickupAddress}
                  icon={<span className="text-xl">📍</span>}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Destination
                </label>
                <AddressInput
                  placeholder="Where are you going?"
                  onAddressSelect={setDestinationAddress}
                  icon={<span className="text-xl">🎯</span>}
                />
              </div>
              {isScheduled && (
                <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-xl">
                  <h3 className="font-semibold text-gray-800">
                    Schedule Your Ride
                  </h3>

                  <button
                    onClick={() => setShowCalendar(true)}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl hover:border-blue-500 
                 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200
                 text-left flex items-center justify-between group"
                  >
                    <span
                      className={
                        scheduledDateTime ? "text-gray-800" : "text-gray-500"
                      }
                    >
                      {scheduledDateTime
                        ? new Date(scheduledDateTime).toLocaleString()
                        : "Select date and time"}
                    </span>
                    <svg
                      className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors duration-200"
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

                  <div className="text-sm text-gray-600">
                    <p>
                      For airport trips, we recommend booking at least 2 hours
                      in advance.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="schedule"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="schedule"
                  className="text-sm font-medium text-gray-700"
                >
                  Schedule for later
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                         text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 
                         transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-blue-200 
                         shadow-lg hover:shadow-xl"
            >
              Get Price Estimate
            </button>
          </form>
        ) : (
          /* Price Estimate Display */
          <div className="space-y-6">
            {/* Price Disclaimer */}
            <div className="bg-blue-50 rounded-2xl p-4 border-l-4 border-blue-500">
              <div className="flex items-start">
                <div className="text-blue-500 mr-2 text-lg">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Price Estimate Notice</p>
                  <p>
                    This is an estimate based on distance and time. If the price
                    doesn't seem right, please let your driver know the current
                    Uber/Lyft price before pickup. We'll match their price and
                    apply our 15% discount.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Trip Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className="font-medium">
                    {priceEstimate.distance} miles
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated time:</span>
                  <span className="font-medium">
                    {priceEstimate.estimatedTime} minutes
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-2xl p-6">
              <div className="text-center mb-4">
                <div className="text-sm text-gray-600 mb-1">
                  Estimated Total
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  ${priceEstimate.finalPrice}
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Includes 15% discount (Save ${priceEstimate.savings})
                </div>
              </div>

              <div className="text-xs text-gray-500 text-center">
                Final price may be adjusted to match competitor rates with 15%
                discount applied
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setPriceEstimate(null);
                  setPickupAddress(null);
                  setDestinationAddress(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-2xl hover:bg-gray-300 transition-all duration-200"
              >
                Back
              </button>
              <button
                onClick={handleBookRide}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 
                           text-white font-semibold py-3 px-4 rounded-2xl transition-all duration-200"
              >
                Book Ride
              </button>
            </div>
          </div>
        )}
      </div>
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
