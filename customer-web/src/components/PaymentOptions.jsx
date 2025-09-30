import React, { useState } from "react";

const PaymentOptions = ({ totalFare, onPaymentSelect, driverInfo }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [showCashWarning, setShowCashWarning] = useState(false);

  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      icon: "💵",
      fee: "$0",
      description: "Pay driver in cash",
      savings: `Save $${(totalFare * 0.029 + 0.3).toFixed(2)}`,
      instructions: "Have exact change ready for your driver",
      warning: true, // Shows warning modal
    },
    {
      id: "venmo",
      name: "Venmo",
      icon: "📱",
      fee: "$0",
      description: "Pay via Venmo",
      savings: `Save $${(totalFare * 0.029 + 0.3).toFixed(2)}`,
      instructions: `Send to @${
        driverInfo?.venmo || "nela-driver"
      } with note "Ride ${new Date().getTime().toString().slice(-6)}"`,
    },
    {
      id: "cashapp",
      name: "Cash App",
      icon: "💸",
      fee: "$0",
      description: "Pay via Cash App",
      savings: `Save $${(totalFare * 0.029 + 0.3).toFixed(2)}`,
      instructions: `Send to $${driverInfo?.cashapp || "NELADriver"}`,
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: "💳",
      fee: "$0",
      description: "Pay via PayPal",
      savings: `Save $${(totalFare * 0.029 + 0.3).toFixed(2)}`,
      instructions: `Send to ${
        driverInfo?.paypal || "payments@nela-rides.com"
      }`,
    },
    {
      id: "zelle",
      name: "Zelle",
      icon: "🏦",
      fee: "$0",
      description: "Bank transfer via Zelle",
      savings: `Save $${(totalFare * 0.029 + 0.3).toFixed(2)}`,
      instructions: `Send to ${
        driverInfo?.phone || "(555) 123-4567"
      } with memo "NELA Ride"`,
    },
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: "💳",
      fee: `$${(totalFare * 0.029 + 0.3).toFixed(2)}`,
      description: "Pay with card (processing fee applies)",
      savings: null,
      instructions: "Secure payment processing via Stripe",
    },
  ];

  const handleMethodClick = (method) => {
    setSelectedMethod(method);

    // If cash selected, show warning modal
    if (method.id === "cash") {
      setShowCashWarning(true);
    }
  };

  const handleCashAccept = () => {
    setShowCashWarning(false);
    onPaymentSelect(selectedMethod);
  };

  const handleCashDecline = () => {
    setShowCashWarning(false);
    setSelectedMethod(null);
  };

  const handleConfirmPayment = () => {
    if (!selectedMethod) {
      alert("Please select a payment method");
      return;
    }

    // For non-cash methods, proceed directly
    if (selectedMethod.id !== "cash") {
      onPaymentSelect(selectedMethod);
    }
  };

  return (
    <div className="payment-options">
      <h3 className="text-xl font-bold mb-4">Choose Payment Method</h3>

      {/* Savings Banner */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-green-800">💰 Save Money!</h4>
        <p className="text-green-700 text-sm">
          Use cash, Venmo, Cash App, PayPal, or Zelle to avoid processing fees!
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            onClick={() => handleMethodClick(method)}
            className={`payment-method-card p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMethod?.id === method.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{method.icon}</span>
                <div>
                  <h4 className="font-semibold">{method.name}</h4>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{method.fee}</div>
                {method.savings && (
                  <div className="text-sm text-green-600 font-medium">
                    {method.savings}
                  </div>
                )}
              </div>
            </div>

            {selectedMethod?.id === method.id && (
              <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                <p className="text-sm font-medium text-gray-700">
                  Instructions:
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {method.instructions}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment Summary */}
      {selectedMethod && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span>Ride Fare:</span>
            <span>${totalFare}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Processing Fee:</span>
            <span>{selectedMethod.fee}</span>
          </div>
          <div className="border-t pt-2">
            <div className="flex justify-between items-center font-bold">
              <span>Total:</span>
              <span>
                $
                {selectedMethod.id === "card"
                  ? (totalFare + (totalFare * 0.029 + 0.3)).toFixed(2)
                  : totalFare}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Button */}
      {selectedMethod && selectedMethod.id !== "cash" && (
        <button
          onClick={handleConfirmPayment}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200"
        >
          Continue with {selectedMethod.name}
        </button>
      )}

      {/* Cash Warning Modal */}
      {showCashWarning && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Warning Icon */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
              Cash Payment Policy
            </h2>

            {/* Warning Message */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
              <p className="text-red-900 font-semibold mb-3 text-center">
                ⚠️ IMPORTANT: Read Carefully
              </p>
              <ul className="space-y-2 text-sm text-red-800">
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-1">•</span>
                  <span>
                    <strong>Cash MUST be paid BEFORE the ride begins</strong>
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-1">•</span>
                  <span>
                    Driver will not start the trip until payment is received
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-1">•</span>
                  <span>
                    <strong>
                      Failure to pay = Immediate ride cancellation
                    </strong>
                  </span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-1">•</span>
                  <span>
                    <strong>NO EXCEPTIONS</strong> - This policy is strictly
                    enforced
                  </span>
                </li>
              </ul>
            </div>

            {/* Amount Due */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Amount Due (Cash)</p>
              <p className="text-3xl font-bold text-gray-900">${totalFare}</p>
              <p className="text-xs text-gray-500 mt-2">
                Please have exact change ready
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleCashAccept}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-xl transition-all duration-200"
              >
                ✓ I Understand - I Will Pay Cash Before Ride
              </button>

              <button
                onClick={handleCashDecline}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-200"
              >
                Choose Different Payment Method
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-center text-gray-500 mt-4">
              By confirming, you agree to our cash payment policy
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;
