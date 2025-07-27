const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(auth);

// Create new order
router.post('/', [
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.productId').isMongoId().withMessage('Valid product ID required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity required'),
  body('items.*.size').optional().trim(),
  body('shippingAddress.firstName').trim().notEmpty().withMessage('First name required'),
  body('shippingAddress.lastName').trim().notEmpty().withMessage('Last name required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street address required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City required'),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('ZIP code required'),
  body('paymentMethod').isIn(['stripe', 'paypal', 'cod']).withMessage('Valid payment method required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items, shippingAddress, billingAddress, paymentMethod } = req.body;

    // Validate and calculate order total
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ error: `Product not found: ${item.productId}` });
      }

      // Check stock availability
      let available = false;
      if (product.category === 'T-Shirts' || item.size) {
        if (!item.size) {
          return res.status(400).json({ 
            error: `Size is required for ${product.name}` 
          });
        }
        const variant = product.variants.find(v => v.size === item.size);
        if (variant && variant.stock >= item.quantity) {
          available = true;
        }
      } else {
        if (product.totalStock >= item.quantity) {
          available = true;
        }
      }

      if (!available) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${product.name}${item.size ? ` (Size: ${item.size})` : ''}` 
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        size: item.size || null,
        sku: item.size ? product.variants.find(v => v.size === item.size)?.sku : null
      });
    }

    // Calculate totals (simplified - add tax/shipping logic as needed)
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const total = subtotal + tax + shipping;

    // Create order
    const order = new Order({
      customer: req.user.userId,
      items: orderItems,
      subtotal,
      tax,
      shipping,
      total,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (item.size) {
        const variant = product.variants.find(v => v.size === item.size);
        if (variant) {
          variant.stock -= item.quantity;
        }
      } else {
        product.totalStock -= item.quantity;
      }
      product.sales += item.quantity;
      await product.save();
    }

    await order.populate('customer', 'username email');
    await order.populate('items.product', 'name price');

    res.status(201).json({
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/my-orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ customer: req.user.userId })
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({ customer: req.user.userId });

    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalOrders: total
      }
    });

  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get specific order
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.userId
    })
    .populate('customer', 'username email')
    .populate('items.product', 'name price images');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);

  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;