# Create middleware and payment routes

import os

# Create middleware directory
os.makedirs('middleware', exist_ok=True)

# Authentication middleware
auth_middleware = '''const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }

    // Add user info to request
    req.user = {
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

module.exports = auth;'''

# Admin authentication middleware
admin_auth_middleware = '''const adminAuth = (req, res, next) => {
  try {
    // Check if user is authenticated (auth middleware should run first)
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied - Admin privileges required' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ error: 'Authorization failed' });
  }
};

module.exports = adminAuth;'''

# Payment routes with Stripe integration
payment_routes = '''const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const auth = require('../middleware/auth');

const router = express.Router();

// Create payment intent for Stripe
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { orderId } = req.body;

    // Find the order
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user.userId,
      paymentStatus: 'pending'
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already paid' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        orderId: order._id.toString(),
        customerId: req.user.userId.toString()
      }
    });

    // Update order with payment intent ID
    order.paymentDetails.paymentIntentId = paymentIntent.id;
    await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Confirm payment
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      const order = await Order.findOneAndUpdate(
        { 
          _id: orderId,
          customer: req.user.userId,
          'paymentDetails.paymentIntentId': paymentIntentId
        },
        {
          paymentStatus: 'completed',
          status: 'processing',
          'paymentDetails.transactionId': paymentIntent.id,
          'paymentDetails.receiptUrl': paymentIntent.charges.data[0]?.receipt_url
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      res.json({
        message: 'Payment confirmed successfully',
        order
      });

    } else {
      res.status(400).json({ 
        error: 'Payment not completed',
        status: paymentIntent.status 
      });
    }

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// Stripe webhook for payment events
router.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const orderId = paymentIntent.metadata.orderId;

        // Update order status
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'completed',
          status: 'processing'
        });

        console.log(`Payment succeeded for order: ${orderId}`);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedOrderId = failedPayment.metadata.orderId;

        // Update order status
        await Order.findByIdAndUpdate(failedOrderId, {
          paymentStatus: 'failed'
        });

        console.log(`Payment failed for order: ${failedOrderId}`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Get payment methods for customer
router.get('/payment-methods', auth, async (req, res) => {
  try {
    // This would typically retrieve saved payment methods from Stripe
    // For now, return available payment options
    res.json({
      methods: [
        {
          type: 'stripe',
          name: 'Credit/Debit Card',
          enabled: true
        },
        {
          type: 'paypal',
          name: 'PayPal',
          enabled: false // Implement PayPal integration separately
        },
        {
          type: 'cod',
          name: 'Cash on Delivery',
          enabled: true
        }
      ]
    });

  } catch (error) {
    console.error('Payment methods fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

module.exports = router;'''

# Save middleware and payment routes
with open('middleware/auth.js', 'w') as f:
    f.write(auth_middleware)

with open('middleware/adminAuth.js', 'w') as f:
    f.write(admin_auth_middleware)

with open('routes/payment.js', 'w') as f:
    f.write(payment_routes)

print("Created middleware and payment routes:")
print("✅ middleware/auth.js")
print("✅ middleware/adminAuth.js")
print("✅ routes/payment.js")