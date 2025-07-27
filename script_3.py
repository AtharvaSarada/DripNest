# Create remaining routes and middleware

# Admin routes for product management
admin_routes = '''const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(auth);
router.use(adminAuth);

// Dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $in: ['processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);

    const recentOrders = await Order.find()
      .populate('customer', 'username email')
      .sort({ createdAt: -1 })
      .limit(10);

    const lowStockProducts = await Product.find({
      isActive: true,
      $or: [
        { totalStock: { $lte: 5 } },
        { 'variants.stock': { $lte: 5 } }
      ]
    }).limit(10);

    res.json({
      statistics: {
        totalProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentOrders,
      lowStockProducts
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all products (admin view with inactive products)
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.isActive = req.query.status === 'active';

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalProducts: total
      }
    });

  } catch (error) {
    console.error('Admin products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create new product
router.post('/products', [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name is required'),
  body('description').trim().isLength({ min: 1, max: 2000 }).withMessage('Product description is required'),
  body('category').isIn(['T-Shirts', 'Hoodies', 'Jeans', 'Shoes', 'Accessories']).withMessage('Valid category required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('variants').optional().isArray(),
  body('totalStock').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const productData = req.body;

    // For T-shirts, ensure variants with sizes are provided
    if (productData.category === 'T-Shirts' && (!productData.variants || productData.variants.length === 0)) {
      return res.status(400).json({ 
        error: 'T-shirts must have size variants (XS, S, M, L, XL, XXL)' 
      });
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.put('/products/:id', [
  body('name').optional().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ min: 1, max: 2000 }),
  body('category').optional().isIn(['T-Shirts', 'Hoodies', 'Jeans', 'Shoes', 'Accessories']),
  body('price').optional().isFloat({ min: 0 }),
  body('variants').optional().isArray(),
  body('totalStock').optional().isInt({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    await product.save();

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (soft delete)
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    product.isActive = false;
    await product.save();

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update stock for specific variant
router.put('/products/:id/stock', [
  body('size').optional().trim(),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { size, stock } = req.body;

    if (size && product.variants.length > 0) {
      // Update specific variant stock
      const variant = product.variants.find(v => v.size === size);
      if (!variant) {
        return res.status(400).json({ error: 'Size variant not found' });
      }
      variant.stock = stock;
    } else {
      // Update total stock
      product.totalStock = stock;
    }

    await product.save();

    res.json({
      message: 'Stock updated successfully',
      product
    });

  } catch (error) {
    console.error('Stock update error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Get all orders
router.get('/orders', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate('customer', 'username email')
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

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

// Update order status
router.put('/orders/:id/status', [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = req.body.status;
    if (req.body.trackingNumber) {
      order.trackingNumber = req.body.trackingNumber;
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

module.exports = router;'''

# Order routes
order_routes = '''const express = require('express');
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

module.exports = router;'''

# Save additional route files
with open('routes/admin.js', 'w') as f:
    f.write(admin_routes)

with open('routes/orders.js', 'w') as f:
    f.write(order_routes)

print("Created additional API routes:")
print("✅ routes/admin.js")
print("✅ routes/orders.js")