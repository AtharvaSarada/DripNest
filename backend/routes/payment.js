const express = require('express');
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

module.exports = router;