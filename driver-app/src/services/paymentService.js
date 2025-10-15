// services/paymentService.js
// Unified Payment Service - Handles ALL payment methods
// Card (Stripe) | Venmo | Cash App | PayPal | Cash

const STRIPE_SECRET_KEY = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY;
// Payment method identifiers
export const PAYMENT_METHODS = {
  CARD: "card",
  VENMO: "venmo",
  CASHAPP: "cashapp",
  PAYPAL: "paypal",
  CASH: "cash",
};

class UnifiedPaymentService {
  constructor() {
    this.stripeConfigured = !!STRIPE_SECRET_KEY;
    this.stripeBaseUrl = "https://api.stripe.com/v1";

    // Driver payment info (from environment or config)
    this.driverVenmo = process.env.EXPO_PUBLIC_DRIVER_VENMO || "nela-driver";
    this.driverCashApp =
      process.env.EXPO_PUBLIC_DRIVER_CASHAPP || "$NELADriver";
    this.driverPayPal =
      process.env.EXPO_PUBLIC_DRIVER_PAYPAL || "driver@nela.com";

    this.pendingPayments = new Map(); // Track payment states

    console.log("✅ Unified Payment Service initialized");
    console.log(
      `   Card payments: ${this.stripeConfigured ? "Ready" : "Not configured"}`
    );
    console.log(`   Venmo: @${this.driverVenmo}`);
    console.log(`   Cash App: ${this.driverCashApp}`);
    console.log(`   PayPal: ${this.driverPayPal}`);
  }

  /**
   * MAIN ENTRY POINT: Process payment based on method
   */
  async processPayment(paymentMethod, amount, rideData) {
    console.log(`💳 Processing payment: ${paymentMethod} for $${amount}`);

    try {
      switch (paymentMethod) {
        case PAYMENT_METHODS.CARD:
          return await this._processCardPayment(amount, rideData);

        case PAYMENT_METHODS.VENMO:
          return await this._processVenmoPayment(amount, rideData);

        case PAYMENT_METHODS.CASHAPP:
          return await this._processCashAppPayment(amount, rideData);

        case PAYMENT_METHODS.PAYPAL:
          return await this._processPayPalPayment(amount, rideData);

        case PAYMENT_METHODS.CASH:
          return await this._processCashPayment(amount, rideData);

        default:
          throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }
    } catch (error) {
      console.error(`❌ Payment processing failed:`, error);
      return {
        success: false,
        error: error.message,
        method: paymentMethod,
      };
    }
  }

  /**
   * Complete payment (when trip ends)
   */
  async completePayment(paymentMethod, rideId, finalAmount) {
    console.log(`✅ Completing payment for ride ${rideId}: $${finalAmount}`);

    const payment = this.pendingPayments.get(rideId);

    if (!payment) {
      console.warn(`⚠️ No pending payment found for ride ${rideId}`);
    }

    try {
      switch (paymentMethod) {
        case PAYMENT_METHODS.CARD:
          return await this._captureCardPayment(
            payment?.paymentIntentId,
            finalAmount
          );

        case PAYMENT_METHODS.VENMO:
        case PAYMENT_METHODS.CASHAPP:
        case PAYMENT_METHODS.PAYPAL:
          return await this._sendPaymentRequest(
            paymentMethod,
            payment,
            finalAmount
          );

        case PAYMENT_METHODS.CASH:
          return {
            success: true,
            method: PAYMENT_METHODS.CASH,
            status: "collected_in_person",
            message: "Cash collected by driver",
          };

        default:
          throw new Error(
            `Cannot complete payment for method: ${paymentMethod}`
          );
      }
    } catch (error) {
      console.error(`❌ Payment completion failed:`, error);
      return {
        success: false,
        error: error.message,
      };
    } finally {
      this.pendingPayments.delete(rideId);
    }
  }

  /**
   * Cancel payment (if ride cancelled)
   */
  async cancelPayment(paymentMethod, rideId, reason = "Ride cancelled") {
    console.log(`🚫 Cancelling payment for ride ${rideId}`);

    const payment = this.pendingPayments.get(rideId);

    try {
      if (paymentMethod === PAYMENT_METHODS.CARD && payment?.paymentIntentId) {
        return await this._cancelStripePayment(payment.paymentIntentId, reason);
      }

      // For other methods, just clear tracking
      this.pendingPayments.delete(rideId);

      return {
        success: true,
        method: paymentMethod,
        status: "cancelled",
        message: "Payment cancelled",
      };
    } catch (error) {
      console.error(`❌ Payment cancellation failed:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ========================================
  // CARD PAYMENT (STRIPE)
  // ========================================

  async _processCardPayment(amount, rideData) {
    if (!this.stripeConfigured) {
      throw new Error("Stripe not configured");
    }

    const amountCents = Math.round(parseFloat(amount) * 100);
    const { customerEmail, id: rideId } = rideData;

    const paymentIntent = await this._stripeRequest(
      "/payment_intents",
      "POST",
      {
        amount: amountCents,
        currency: "usd",
        "capture_method": "manual", // Pre-auth only
        "description": `NELA Ride ${rideId}`,
        "receipt_email": customerEmail,
        "metadata[project]": "NELA",
        "metadata[rideId]": rideId,
      }
    );

    // Track payment
    this.pendingPayments.set(rideId, {
      method: PAYMENT_METHODS.CARD,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      status: "authorized",
    });

    return {
      success: true,
      method: PAYMENT_METHODS.CARD,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: "authorized",
      message: `$${amount} pre-authorized on card`,
    };
  }

  async _captureCardPayment(paymentIntentId, finalAmount) {
    if (!paymentIntentId) {
      throw new Error("No payment intent ID provided");
    }

    const amountCents = Math.round(parseFloat(finalAmount) * 100);

    const paymentIntent = await this._stripeRequest(
      `/payment_intents/${paymentIntentId}/capture`,
      "POST",
      { "amount_to_capture": amountCents }
    );

    return {
      success: true,
      method: PAYMENT_METHODS.CARD,
      paymentIntentId: paymentIntent.id,
      amount: finalAmount,
      status: "captured",
      message: `$${finalAmount} charged to card`,
    };
  }

  async _cancelStripePayment(paymentIntentId, reason) {
    const paymentIntent = await this._stripeRequest(
      `/payment_intents/${paymentIntentId}/cancel`,
      "POST",
      { "cancellation_reason": "requested_by_customer" }
    );

    return {
      success: true,
      method: PAYMENT_METHODS.CARD,
      status: "cancelled",
      message: "Pre-authorization released",
    };
  }

  async _stripeRequest(endpoint, method = "POST", data = {}) {
    const formBody = Object.keys(data)
      .map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`
      )
      .join("&");

    const response = await fetch(`${this.stripeBaseUrl}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: method !== "GET" ? formBody : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Stripe API error");
    }

    return result;
  }

  // ========================================
  // VENMO PAYMENT
  // ========================================

  async _processVenmoPayment(amount, rideData) {
    const { id: rideId } = rideData;

    this.pendingPayments.set(rideId, {
      method: PAYMENT_METHODS.VENMO,
      amount: amount,
      status: "pending",
      username: this.driverVenmo,
    });

    return {
      success: true,
      method: PAYMENT_METHODS.VENMO,
      status: "pending",
      message: `Will send Venmo request for $${amount} after trip`,
    };
  }

  async _sendVenmoRequest(payment, finalAmount) {
    const venmoUrl = `venmo://paycharge?txn=pay&recipients=${this.driverVenmo}&amount=${finalAmount}&note=NELA Ride Payment`;
    const venmoWebUrl = `https://venmo.com/${this.driverVenmo}?txn=pay&amount=${finalAmount}&note=NELA%20Ride%20Payment`;

    return {
      success: true,
      method: PAYMENT_METHODS.VENMO,
      status: "request_sent",
      amount: finalAmount,
      paymentUrl: venmoUrl,
      webUrl: venmoWebUrl,
      message: `Venmo request sent for $${finalAmount}`,
      instructions: `Open Venmo and pay @${this.driverVenmo}`,
    };
  }

  // ========================================
  // CASH APP PAYMENT
  // ========================================

  async _processCashAppPayment(amount, rideData) {
    const { id: rideId } = rideData;

    this.pendingPayments.set(rideId, {
      method: PAYMENT_METHODS.CASHAPP,
      amount: amount,
      status: "pending",
      cashtag: this.driverCashApp,
    });

    return {
      success: true,
      method: PAYMENT_METHODS.CASHAPP,
      status: "pending",
      message: `Will send Cash App request for $${amount} after trip`,
    };
  }

  async _sendCashAppRequest(payment, finalAmount) {
    const cashAppUrl = `https://cash.app/${this.driverCashApp}/${finalAmount}`;

    return {
      success: true,
      method: PAYMENT_METHODS.CASHAPP,
      status: "request_sent",
      amount: finalAmount,
      paymentUrl: cashAppUrl,
      message: `Cash App request sent for $${finalAmount}`,
      instructions: `Open Cash App and pay ${this.driverCashApp}`,
    };
  }

  // ========================================
  // PAYPAL PAYMENT
  // ========================================

  async _processPayPalPayment(amount, rideData) {
    const { id: rideId } = rideData;

    this.pendingPayments.set(rideId, {
      method: PAYMENT_METHODS.PAYPAL,
      amount: amount,
      status: "pending",
      email: this.driverPayPal,
    });

    return {
      success: true,
      method: PAYMENT_METHODS.PAYPAL,
      status: "pending",
      message: `Will send PayPal request for $${amount} after trip`,
    };
  }

  async _sendPayPalRequest(payment, finalAmount) {
    const paypalUrl = `https://www.paypal.me/${this.driverPayPal}/${finalAmount}`;

    return {
      success: true,
      method: PAYMENT_METHODS.PAYPAL,
      status: "request_sent",
      amount: finalAmount,
      paymentUrl: paypalUrl,
      message: `PayPal request sent for $${finalAmount}`,
      instructions: `Pay via PayPal to ${this.driverPayPal}`,
    };
  }

  // ========================================
  // CASH PAYMENT
  // ========================================

  async _processCashPayment(amount, rideData) {
    const { id: rideId } = rideData;

    this.pendingPayments.set(rideId, {
      method: PAYMENT_METHODS.CASH,
      amount: amount,
      status: "pending",
    });

    return {
      success: true,
      method: PAYMENT_METHODS.CASH,
      status: "pending",
      message: `Cash payment: $${amount} to be collected by driver`,
    };
  }

  // ========================================
  // HELPER: Send payment request (Venmo/CashApp/PayPal)
  // ========================================

  async _sendPaymentRequest(method, payment, finalAmount) {
    switch (method) {
      case PAYMENT_METHODS.VENMO:
        return await this._sendVenmoRequest(payment, finalAmount);
      case PAYMENT_METHODS.CASHAPP:
        return await this._sendCashAppRequest(payment, finalAmount);
      case PAYMENT_METHODS.PAYPAL:
        return await this._sendPayPalRequest(payment, finalAmount);
      default:
        throw new Error(`Cannot send request for method: ${method}`);
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  getPendingPayment(rideId) {
    return this.pendingPayments.get(rideId);
  }

  isMethodSupported(method) {
    return Object.values(PAYMENT_METHODS).includes(method);
  }

  getAvailableMethods() {
    return [
      {
        id: PAYMENT_METHODS.CARD,
        name: "Credit/Debit Card",
        icon: "💳",
        available: this.stripeConfigured,
        recommended: true,
      },
      {
        id: PAYMENT_METHODS.VENMO,
        name: "Venmo",
        icon: "📱",
        available: true,
        username: `@${this.driverVenmo}`,
      },
      {
        id: PAYMENT_METHODS.CASHAPP,
        name: "Cash App",
        icon: "💵",
        available: true,
        cashtag: this.driverCashApp,
      },
      {
        id: PAYMENT_METHODS.PAYPAL,
        name: "PayPal",
        icon: "🅿️",
        available: true,
        email: this.driverPayPal,
      },
      {
        id: PAYMENT_METHODS.CASH,
        name: "Cash",
        icon: "💰",
        available: true,
      },
    ];
  }

  getStatus() {
    return {
      initialized: true,
      cardPayments: this.stripeConfigured,
      venmo: `@${this.driverVenmo}`,
      cashApp: this.driverCashApp,
      paypal: this.driverPayPal,
      pendingPaymentsCount: this.pendingPayments.size,
    };
  }
}

export default new UnifiedPaymentService();
