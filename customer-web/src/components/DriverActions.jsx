import React, { useState } from "react";
import { updateRideStatusWithNotification } from "../services/firebaseService";

function DriverActions({ rideId, currentStatus, onStatusUpdate }) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus, driverData = {}) => {
    setIsUpdating(true);
    try {
      await updateRideStatusWithNotification(rideId, newStatus, {
        driverName: "John Doe", // This would come from driver profile
        vehicleInfo: "Black Honda Civic - ABC123", // From driver profile
        eta: 8, // Calculate based on current location
        ...driverData,
      });
      onStatusUpdate(newStatus);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      alert("Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getAvailableActions = () => {
    switch (currentStatus) {
      case "pending":
        return [
          { label: "Accept Ride", status: "accepted", color: "green" },
          { label: "Decline", status: "declined", color: "red" },
        ];
      case "accepted":
        return [{ label: "On My Way", status: "driver_on_way", color: "blue" }];
      case "driver_on_way":
        return [
          { label: "I've Arrived", status: "driver_arrived", color: "orange" },
        ];
      case "driver_arrived":
        return [
          { label: "Customer Picked Up", status: "picked_up", color: "purple" },
        ];
      case "picked_up":
        return [
          { label: "Trip Completed", status: "completed", color: "green" },
        ];
      default:
        return [];
    }
  };

  const actions = getAvailableActions();

  if (actions.length === 0) {
    return (
      <div className="text-gray-500 text-center">No actions available</div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Driver Actions</h3>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleStatusUpdate(action.status)}
            disabled={isUpdating}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 ${
              action.color === "green"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : action.color === "blue"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : action.color === "orange"
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : action.color === "purple"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isUpdating ? "Updating..." : action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default DriverActions;
