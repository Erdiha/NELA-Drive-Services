// services/receiptService.js
// Generates receipts for completed rides

class ReceiptService {
  /**
   * Generate receipt for completed ride
   * @param {Object} ride - Ride data
   * @returns {Object} - Receipt details
   */
  generateReceipt(ride) {
    const finalFare = parseFloat(ride.estimatedFare || ride.fare || 0);
    const distance = ride.distance || "0 miles";

    // Parse distance to get miles
    const distanceMiles = parseFloat(distance);

    // Calculate breakdown (reverse engineer from final fare)
    // Pricing: Base $3.50 + ($2.25/mi) + ($0.35/min) - 15% discount
    const baseFare = 3.5;
    const perMile = 2.25;
    const perMinute = 0.35;

    // Calculate estimated time from distance (if not provided)
    const durationMinutes = ride.estimatedTime
      ? parseInt(ride.estimatedTime)
      : Math.round(distanceMiles * 3);

    const distanceCharge = distanceMiles * perMile;
    const timeCharge = durationMinutes * perMinute;
    const subtotal = baseFare + distanceCharge + timeCharge;
    const discount = subtotal * 0.15; // 15% discount

    // Calculate trip duration
    const startTime = ride.startedAt ? new Date(ride.startedAt) : null;
    const endTime = ride.completedAt ? new Date(ride.completedAt) : new Date();
    const actualDurationMinutes = startTime
      ? Math.round((endTime - startTime) / 60000)
      : durationMinutes;

    return {
      rideId: ride.id,
      completedAt: endTime.toISOString(),

      // Trip details
      pickupAddress: ride.pickupAddress || ride.pickup?.address,
      destinationAddress: ride.destinationAddress || ride.dropoff?.address,
      distance: distance,
      duration: `${actualDurationMinutes} min`,

      // Passenger info
      customerName: ride.customerName || ride.passengerName,
      customerEmail: ride.customerEmail,
      customerPhone: ride.customerPhone,

      // Pricing breakdown
      baseFare: baseFare.toFixed(2),
      distanceCharge: distanceCharge.toFixed(2),
      timeCharge: timeCharge.toFixed(2),
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      finalFare: finalFare.toFixed(2),

      // Payment
      paymentMethod: ride.paymentMethod?.name || "Cash",

      // Driver info
      driverName: ride.driverName,
      driverPhone: ride.driverPhone,
      driverVehicle: ride.driverVehicle,
    };
  }

  /**
   * Format receipt as plain text
   */
  formatReceiptText(receipt) {
    return `
═══════════════════════════════
🚗 NELA RIDE RECEIPT
═══════════════════════════════

Ride ID: ${receipt.rideId}
Date: ${new Date(receipt.completedAt).toLocaleString()}

───────────────────────────────
TRIP DETAILS
───────────────────────────────
From: ${receipt.pickupAddress}
To: ${receipt.destinationAddress}

Distance: ${receipt.distance}
Duration: ${receipt.duration}

───────────────────────────────
CHARGES
───────────────────────────────
Base Fare:           $${receipt.baseFare}
Distance Charge:     $${receipt.distanceCharge}
Time Charge:         $${receipt.timeCharge}
───────────────────────────────
Subtotal:            $${receipt.subtotal}
NELA Discount (15%): -$${receipt.discount}
───────────────────────────────
TOTAL PAID:          $${receipt.finalFare}
───────────────────────────────

Payment Method: ${receipt.paymentMethod}

═══════════════════════════════
Thank you for riding with NELA!
═══════════════════════════════
    `.trim();
  }

  /**
   * Format receipt as HTML (for future web display)
   */
  formatReceiptHTML(receipt) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .receipt-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
    .section { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .row { display: flex; justify-content: space-between; margin: 8px 0; }
    .total { font-size: 24px; font-weight: bold; color: #10b981; }
    .divider { border-top: 2px solid #e5e7eb; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="receipt-header">
    <h1>🚗 NELA RIDE RECEIPT</h1>
    <p>Ride ID: ${receipt.rideId}</p>
    <p>${new Date(receipt.completedAt).toLocaleString()}</p>
  </div>
  
  <div class="section">
    <h3>Trip Details</h3>
    <div class="row"><span>From:</span><span>${
      receipt.pickupAddress
    }</span></div>
    <div class="row"><span>To:</span><span>${
      receipt.destinationAddress
    }</span></div>
    <div class="row"><span>Distance:</span><span>${
      receipt.distance
    }</span></div>
    <div class="row"><span>Duration:</span><span>${
      receipt.duration
    }</span></div>
  </div>
  
  <div class="section">
    <h3>Charges</h3>
    <div class="row"><span>Base Fare:</span><span>$${
      receipt.baseFare
    }</span></div>
    <div class="row"><span>Distance Charge:</span><span>$${
      receipt.distanceCharge
    }</span></div>
    <div class="row"><span>Time Charge:</span><span>$${
      receipt.timeCharge
    }</span></div>
    <div class="divider"></div>
    <div class="row"><span>Subtotal:</span><span>$${
      receipt.subtotal
    }</span></div>
    <div class="row"><span>NELA Discount (15%):</span><span style="color: #10b981;">-$${
      receipt.discount
    }</span></div>
    <div class="divider"></div>
    <div class="row total"><span>TOTAL PAID:</span><span>$${
      receipt.finalFare
    }</span></div>
  </div>
  
  <div class="section">
    <div class="row"><span>Payment Method:</span><span>${
      receipt.paymentMethod
    }</span></div>
  </div>
  
  <div style="text-align: center; color: #6b7280; margin-top: 30px;">
    <p>Thank you for riding with NELA!</p>
    <p>Questions? support@nelarides.com | (555) 123-4567</p>
  </div>
</body>
</html>
    `.trim();
  }
}

export default new ReceiptService();
