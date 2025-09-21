import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

const sendSMSFunction = httpsCallable(functions, "sendSMS");

export async function sendSMS(to, message) {
  try {
    const result = await sendSMSFunction({ to, message });
    return result.data;
  } catch (error) {
    console.error("Error sending SMS:", error);
    throw error;
  }
}

// Your existing SMS_TEMPLATES remain the same
export const SMS_TEMPLATES = {
  onTheWay: (driverName, eta) =>
    `Hi! Your NELA driver ${driverName} is on the way. ETA: ${eta} minutes.`,

  arrived: (driverName, vehicleInfo) =>
    `Your NELA driver ${driverName} has arrived! Vehicle: ${vehicleInfo}. Look for us outside.`,

  pickedUp: (driverName, destination) =>
    `Trip started! ${driverName} is taking you to ${destination}. Enjoy your ride!`,

  completed: (driverName, fare) =>
    `Trip completed! Thanks for riding with NELA. Fare: $${fare}.`,
};
