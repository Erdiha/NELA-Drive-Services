import React, { useState, useEffect } from "react";

const RideTrackingPage = ({
  rideData,
  pickupAddress,
  destinationAddress,
  priceEstimate,
  rideId,
  onBookAnother,
  isScheduled,
  scheduledDateTime,
}) => {
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (rideData?.driverLocation && pickupAddress) {
      const calc = calculateETA(rideData.driverLocation, {
        lat: pickupAddress.lat,
        lng: pickupAddress.lng,
      });
      setEta(calc.eta);
      setDistance(calc.distance);
    }
  }, [rideData?.driverLocation, pickupAddress]);

  const calculateETA = (from, to) => {
    const R = 3959;
    const dLat = toRad(to.lat - from.latitude);
    const dLon = toRad(to.lng - from.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(from.latitude)) *
        Math.cos(toRad(to.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return {
      distance: dist.toFixed(1),
      eta: Math.max(Math.round((dist / 25) * 60), 3),
    };
  };

  const toRad = (deg) => deg * (Math.PI / 180);

  const getStatusDisplay = () => {
    if (!rideData) {
      if (isScheduled) {
        const rideTime = new Date(scheduledDateTime);
        const hoursUntil = (rideTime - new Date()) / (1000 * 60 * 60);
        if (hoursUntil > 1) {
          return {
            title: "Ride Scheduled",
            subtitle: `Scheduled for ${rideTime.toLocaleString()}`,
            color: "purple",
            icon: "📅",
          };
        }
      }
      return {
        title: "Looking for Driver",
        subtitle: "Finding nearby driver...",
        color: "blue",
        icon: "🔍",
      };
    }

    switch (rideData.status) {
      case "pending":
        return {
          title: "Finding Driver",
          subtitle: "Searching for available drivers",
          color: "yellow",
          icon: "⏳",
        };
      case "accepted":
        return {
          title: "Driver On The Way",
          subtitle: `Arriving in ${eta || "..."}  min`,
          color: "blue",
          icon: "🚗",
        };
      case "arrived":
        return {
          title: "Driver Has Arrived",
          subtitle: "Look for your driver outside",
          color: "orange",
          icon: "📍",
        };
      case "in_progress":
        return {
          title: "Trip In Progress",
          subtitle: "Heading to destination",
          color: "green",
          icon: "🛣️",
        };
      case "completed":
        return {
          title: "Trip Complete",
          subtitle: "Thanks for riding with NELA",
          color: "green",
          icon: "✅",
        };
      default:
        return {
          title: "Processing",
          subtitle: "Please wait",
          color: "gray",
          icon: "⏳",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pb-6">
      {/* Status Header */}
      <div
        className={`bg-gradient-to-r ${
          statusDisplay.color === "blue"
            ? "from-blue-500 to-blue-600"
            : statusDisplay.color === "green"
            ? "from-green-500 to-green-600"
            : statusDisplay.color === "orange"
            ? "from-orange-500 to-orange-600"
            : statusDisplay.color === "purple"
            ? "from-purple-500 to-purple-600"
            : statusDisplay.color === "yellow"
            ? "from-yellow-500 to-yellow-600"
            : "from-gray-500 to-gray-600"
        } text-white px-6 py-6 shadow-lg`}
      >
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-2">{statusDisplay.icon}</div>
            <div className="text-2xl font-bold mb-1">{statusDisplay.title}</div>
            <div className="text-sm opacity-90">{statusDisplay.subtitle}</div>
          </div>
          <div className="mt-4 text-center">
            <span className="inline-block bg-white/20 rounded-full px-4 py-1 text-xs">
              ID: {rideId?.substring(0, 8)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Driver Card - Only when driver assigned */}
        {rideData?.driverName && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-4 border-2 border-blue-100">
            <div className="flex items-center gap-4 mb-4">
              {rideData.driverPhotoURL ? (
                <img
                  src={rideData.driverPhotoURL}
                  alt={rideData.driverName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-500 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                  {rideData.driverName.charAt(0)}
                </div>
              )}

              <div className="flex-1">
                <div className="text-sm text-gray-500 font-medium mb-1">
                  YOUR DRIVER
                </div>
                <div className="font-bold text-xl text-gray-900">
                  {rideData.driverName}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-semibold">5.0</span>
                  <span className="text-xs text-gray-500">(Driver)</span>
                </div>
              </div>

              {rideData.driverPhone && (
                <a
                  href={`tel:${rideData.driverPhone}`}
                  className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition shadow-lg"
                >
                  <svg
                    className="w-7 h-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </a>
              )}
            </div>

            {/* Vehicle Info */}
            {rideData.driverVehicle && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">
                    Vehicle
                  </span>
                  <span className="font-semibold text-gray-900">
                    {rideData.driverVehicle.year} {rideData.driverVehicle.make}{" "}
                    {rideData.driverVehicle.model}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">
                    Color
                  </span>
                  <span className="font-semibold text-gray-900">
                    {rideData.driverVehicle.color}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">
                    License Plate
                  </span>
                  <span className="font-bold text-xl text-blue-600">
                    {rideData.driverVehicle.licensePlate}
                  </span>
                </div>
              </div>
            )}

            {/* Live ETA */}
            {eta && rideData.status === "accepted" && (
              <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <div className="flex items-center justify-center gap-3">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-2xl font-bold text-green-700">
                    {eta} min
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="text-lg text-gray-700">
                    {distance} miles away
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trip Route Card */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <div className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">
            Trip Route
          </div>

          {/* Pickup */}
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full shadow"></div>
              <div className="w-0.5 flex-1 bg-gray-300 my-1"></div>
            </div>
            <div className="flex-1 pb-4">
              <div className="text-xs text-gray-500 font-semibold mb-1">
                PICKUP
              </div>
              <div className="text-sm font-medium text-gray-900">
                {pickupAddress?.address}
              </div>
            </div>
          </div>

          {/* Destination */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-4 h-4 bg-red-500 rounded-sm shadow"></div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 font-semibold mb-1">
                DESTINATION
              </div>
              <div className="text-sm font-medium text-gray-900">
                {destinationAddress?.address}
              </div>
            </div>
          </div>
        </div>

        {/* Trip Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 font-semibold mb-1">
                DISTANCE
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {priceEstimate?.distance || rideData?.distance || "--"}
                <span className="text-sm text-gray-600 ml-1">mi</span>
              </div>
            </div>
            <div className="text-center border-l border-r border-gray-200">
              <div className="text-xs text-gray-500 font-semibold mb-1">
                DURATION
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {priceEstimate?.estimatedTime ||
                  rideData?.estimatedTime ||
                  "--"}
                <span className="text-sm text-gray-600 ml-1">min</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 font-semibold mb-1">
                FARE
              </div>
              <div className="text-2xl font-bold text-green-600">
                ${priceEstimate?.finalPrice || rideData?.estimatedPrice || "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl h-64 flex items-center justify-center shadow-lg mb-4">
          <div className="text-center">
            <div className="text-5xl mb-3">🗺️</div>
            <div className="text-gray-600 font-medium">Map View</div>
            <div className="text-xs text-gray-500 mt-1">
              Live tracking coming soon
            </div>
          </div>
        </div>

        {/* Action Button */}
        {rideData?.status === "completed" && (
          <button
            onClick={onBookAnother}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
          >
            Book Another Ride
          </button>
        )}
      </div>
    </div>
  );
};

export default RideTrackingPage;
