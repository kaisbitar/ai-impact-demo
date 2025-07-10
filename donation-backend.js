/**
 * Donation Backend for Landing Page
 *
 * Simple Express server for handling donation payments
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the donation landing page at the root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "donation-landing.html"));
});

// Also serve it at /donation-landing.html for explicit access
app.get("/donation-landing.html", (req, res) => {
  res.sendFile(path.join(__dirname, "donation-landing.html"));
});

// Simulate payment intent creation
app.post("/create-payment-intent", (req, res) => {
  const { amount, currency, metadata } = req.body;

  console.log("🌱 Creating payment intent:", { amount, currency, metadata });

  // Simulate Stripe payment intent response
  const mockPaymentIntent = {
    id: "pi_mock_" + Date.now(),
    client_secret: "pi_mock_secret_" + Date.now(),
    amount: amount,
    currency: currency,
    status: "requires_payment_method",
    metadata: metadata,
    created: Math.floor(Date.now() / 1000),
  };

  res.json({
    clientSecret: mockPaymentIntent.client_secret,
    paymentIntent: mockPaymentIntent,
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "🌱 Donation backend running",
  });
});

app.listen(port, () => {
  console.log(`🚀 Donation backend running on http://localhost:${port}`);
  console.log(`📝 Available endpoints:`);
  console.log(`   POST /create-payment-intent - Create payment intent`);
  console.log(`   GET  /health - Health check`);
});

module.exports = app;
