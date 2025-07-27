# Dripnest E-commerce Platform - Complete Setup Guide

## Overview
Dripnest is a full-featured e-commerce platform with separate admin and customer interfaces, mandatory size/quantity selection for T-shirts, and comprehensive product management capabilities.

## Folder Structure
```
dripnest/
├── frontend/
│   ├── index.html              # Main frontend application
│   ├── style.css               # Complete styling
│   ├── app.js                  # Frontend JavaScript logic
│   └── assets/
│       ├── images/             # Product images, logos
│       ├── videos/             # Hero videos, demos  
│       └── icons/              # SVG icons
├── backend/
│   ├── server.js               # Main server file
│   ├── package.json            # Dependencies
│   ├── .env.example            # Environment variables template
│   ├── models/
│   │   ├── User.js            # User authentication model
│   │   ├── Product.js         # Product model with size variants
│   │   └── Order.js           # Order management model
│   ├── routes/
│   │   ├── auth.js            # Authentication routes (admin/customer)
│   │   ├── products.js        # Product CRUD operations
│   │   ├── orders.js          # Order management
│   │   ├── admin.js           # Admin dashboard & controls
│   │   └── payment.js         # Stripe payment integration
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── adminAuth.js       # Admin-only access control
│   └── uploads/               # File upload directory
└── README.md                  # This guide
```

## Key Features Implemented

### ✅ Separate Login Systems
- **Customer Login**: `/api/auth/login/customer`
- **Admin Login**: `/api/auth/login/admin` 
- Different authentication flows and permissions
- JWT-based sessions with role-based access

### ✅ Mandatory Size Selection for T-Shirts
- T-shirt products require size selection (XS, S, M, L, XL, XXL)
- Stock management per size variant
- Automatic validation prevents checkout without size selection

### ✅ Admin Control Panel
- **Product Management**: Add, edit, delete products
- **Stock Control**: Mark products in/out of stock by size
- **Order Management**: View and update order statuses
- **Dashboard**: Sales statistics and inventory alerts

### ✅ Customer Features
- Product browsing with size/quantity selection
- Shopping cart with persistent storage
- Secure checkout process
- Order history and tracking

## Installation & Setup

### Backend Setup
1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/dripnest
   JWT_SECRET=your-super-secret-jwt-key
   STRIPE_SECRET_KEY=sk_test_your_stripe_key
   ```

4. **Start MongoDB**:
   ```bash
   # Install MongoDB if not already installed
   # macOS: brew install mongodb-community
   # Ubuntu: sudo apt install mongodb
   
   # Start MongoDB service
   mongod
   ```

5. **Run the server**:
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Or production mode
   npm start
   ```

6. **Create Admin User**:
   The system creates a default admin user:
   - **Username**: `admin`
   - **Password**: `admin123`

### Frontend Setup
1. **Serve the frontend**:
   ```bash
   # Simple Python server
   cd frontend
   python -m http.server 3001
   
   # Or use any static file server
   npx serve . -p 3001
   ```

2. **Access the application**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## Customization Guide

### Customizing Videos and SVGs

#### Hero Video
Replace the placeholder video in the frontend:
```html
<!-- In index.html, locate the hero section -->
<video autoplay muted loop class="hero__video">
  <source src="assets/videos/your-hero-video.mp4" type="video/mp4">
</video>
```

#### Logo SVG
Update the logo in the header:
```html
<!-- Replace the text logo with your SVG -->
<div class="logo">
  <img src="assets/images/your-logo.svg" alt="Dripnest Logo">
</div>
```

#### Product Images
Replace placeholder images:
1. Add your product images to `frontend/assets/images/products/`
2. Update product data in the backend or frontend JavaScript
3. Use consistent naming: `product-name-variant.jpg`

### Adding New Product Categories
1. **Update Product Model** (`backend/models/Product.js`):
   ```javascript
   category: {
     type: String,
     required: true,
     enum: ['T-Shirts', 'Hoodies', 'Jeans', 'Shoes', 'Accessories', 'New-Category']
   }
   ```

2. **Update Frontend Categories**:
   ```javascript
   // In app.js, update the categories array
   const categories = ['T-Shirts', 'Hoodies', 'Jeans', 'Shoes', 'Accessories', 'New-Category'];
   ```

### Size Management for Different Products
- **T-Shirts**: XS, S, M, L, XL, XXL (mandatory)
- **Jeans**: 28, 30, 32, 34, 36, 38, 40, 42
- **Shoes**: Numeric sizes (add as needed)
- **Accessories**: ONE_SIZE or no size required

### Customizing Colors and Styling
Edit `frontend/style.css` variables:
```css
:root {
  --color-primary: #your-brand-color;
  --color-secondary: #your-accent-color;
  --font-family: 'Your-Font', sans-serif;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login/customer` - Customer login
- `POST /api/auth/login/admin` - Admin login
- `GET /api/auth/profile` - Get user profile

### Products
- `GET /api/products` - List products with filtering
- `GET /api/products/:id` - Get single product
- `POST /api/products/check-availability` - Check stock

### Admin (Requires Admin Auth)
- `GET /api/admin/dashboard` - Dashboard statistics
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `PUT /api/admin/products/:id/stock` - Update stock

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/my-orders` - Customer's orders
- `GET /api/orders/:id` - Get specific order

### Payment
- `POST /api/payment/create-payment-intent` - Stripe payment
- `POST /api/payment/confirm-payment` - Confirm payment

## Default Login Credentials

### Admin Access
- **URL**: Click "Admin Login" on homepage
- **Username**: `admin`
- **Password**: `admin123`

### Test Customer
- **URL**: Click "Customer Login" on homepage  
- **Username**: `customer1`
- **Password**: `password123`

## Database Seeding

The application includes sample data:
- 5 sample products with various categories
- Size variants for T-shirts
- Stock quantities for testing

To add more products, use the admin panel or directly via API.

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting on API endpoints
- Input validation and sanitization
- Helmet.js for security headers

## Payment Integration

### Stripe Setup
1. Create a Stripe account
2. Get API keys from Stripe Dashboard
3. Update `.env` with your keys:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key
   ```

### Webhook Configuration
Set up webhooks in Stripe for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Webhook URL: `https://yourdomain.com/api/payment/stripe-webhook`

## Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)
1. Set environment variables
2. Configure MongoDB Atlas for production
3. Update CORS origins for your domain

### Frontend Deployment (Netlify/Vercel)
1. Update API endpoints to production URLs
2. Configure build settings
3. Set up custom domain

## Troubleshooting

### Common Issues

**MongoDB Connection Error**:
- Ensure MongoDB is running
- Check connection string in `.env`

**JWT Token Issues**:
- Verify JWT_SECRET is set
- Check token expiration times

**Stock Management Problems**:
- Ensure T-shirts have size variants
- Check stock levels in admin panel

**Payment Failures**:
- Verify Stripe API keys
- Test with Stripe test cards

## Support & Customization

This platform is fully customizable. Key areas for modification:

1. **Styling**: Update CSS variables and classes
2. **Product Types**: Modify category enum and validation
3. **Payment Methods**: Add PayPal, Apple Pay, etc.
4. **Shipping**: Implement shipping calculators
5. **Analytics**: Add Google Analytics, tracking pixels

For advanced customizations, modify the appropriate model, route, or frontend component files.

## Performance Optimization

- Implement Redis for session storage
- Add image optimization and CDN
- Enable MongoDB indexing
- Implement caching strategies
- Optimize frontend with lazy loading

The platform is production-ready with proper environment configuration and can handle moderate traffic loads.