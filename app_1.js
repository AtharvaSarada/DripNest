// Dripnest E-commerce Application JavaScript - Fixed Version

// Application State
let currentUser = null;
let currentPage = 'home';
let cart = [];
let products = [];
let customers = [];
let orders = [];

// Sample Data from JSON
const sampleData = {
  "sampleProducts": [
    {
      "id": 1,
      "name": "Classic Cotton T-Shirt",
      "price": 29.99,
      "description": "Comfortable 100% cotton t-shirt perfect for everyday wear",
      "category": "T-Shirts",
      "stock": 50,
      "inStock": true,
      "image": "placeholder-tshirt.jpg"
    },
    {
      "id": 2,
      "name": "Premium Hoodie",
      "price": 59.99,
      "description": "Warm and cozy premium hoodie with modern fit",
      "category": "Hoodies",
      "stock": 25,
      "inStock": true,
      "image": "placeholder-hoodie.jpg"
    },
    {
      "id": 3,
      "name": "Slim Fit Jeans",
      "price": 79.99,
      "description": "Modern slim fit jeans with premium denim",
      "category": "Jeans",
      "stock": 0,
      "inStock": false,
      "image": "placeholder-jeans.jpg"
    },
    {
      "id": 4,
      "name": "Running Sneakers",
      "price": 99.99,
      "description": "Comfortable running sneakers for active lifestyle",
      "category": "Shoes",
      "stock": 15,
      "inStock": true,
      "image": "placeholder-sneakers.jpg"
    },
    {
      "id": 5,
      "name": "Leather Wallet",
      "price": 39.99,
      "description": "Premium leather wallet with multiple card slots",
      "category": "Accessories",
      "stock": 30,
      "inStock": true,
      "image": "placeholder-wallet.jpg"
    }
  ],
  "adminUser": {
    "username": "admin",
    "password": "admin123",
    "role": "admin"
  },
  "sampleCustomers": [
    {
      "id": 1,
      "username": "customer1",
      "email": "customer@example.com",
      "password": "password123",
      "role": "customer"
    }
  ],
  "categories": ["T-Shirts", "Hoodies", "Jeans", "Shoes", "Accessories"],
  "brandInfo": {
    "name": "Dripnest",
    "tagline": "Fashion Forward, Always",
    "description": "Discover the latest trends in fashion with Dripnest's curated collection of premium clothing and accessories."
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    setupEventListeners();
    loadCart();
    updateCartCount();
    showPage('home');
});

// Initialize data from localStorage or use sample data
function initializeData() {
    // Load products
    const savedProducts = localStorage.getItem('dripnest-products');
    if (savedProducts) {
        products = JSON.parse(savedProducts);
    } else {
        products = sampleData.sampleProducts;
        localStorage.setItem('dripnest-products', JSON.stringify(products));
    }
    
    // Load customers
    const savedCustomers = localStorage.getItem('dripnest-customers');
    if (savedCustomers) {
        customers = JSON.parse(savedCustomers);
    } else {
        customers = sampleData.sampleCustomers;
        localStorage.setItem('dripnest-customers', JSON.stringify(customers));
    }
    
    // Load orders
    const savedOrders = localStorage.getItem('dripnest-orders');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    
    // Check for logged in user
    const savedUser = localStorage.getItem('dripnest-current-user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation links - Fixed to work properly
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page);
            }
        });
    });
    
    // All buttons with data-page attribute
    document.querySelectorAll('[data-page]').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                showPage(page);
            }
        });
    });
    
    // Cart button - Fixed
    const cartBtn = document.getElementById('cart-btn');
    if (cartBtn) {
        cartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            renderCart();
            openModal('cart-modal');
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Auth forms
    const customerLoginForm = document.getElementById('customer-login-form');
    if (customerLoginForm) {
        customerLoginForm.addEventListener('submit', handleCustomerLogin);
    }
    
    const customerRegisterForm = document.getElementById('customer-register-form');
    if (customerRegisterForm) {
        customerRegisterForm.addEventListener('submit', handleCustomerRegister);
    }
    
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }
    
    // Admin forms
    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', handleAddProduct);
    }
    
    const editProductForm = document.getElementById('edit-product-form');
    if (editProductForm) {
        editProductForm.addEventListener('submit', handleEditProduct);
    }
    
    // Checkout form
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    // Auth tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
    
    // Admin section navigation
    document.querySelectorAll('[data-admin-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-admin-section');
            showAdminSection(section);
        });
    });
    
    // Account section navigation
    document.querySelectorAll('[data-account-section]').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.getAttribute('data-account-section');
            showAccountSection(section);
        });
    });
    
    // Product search and filter
    const searchInput = document.getElementById('search-products');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
}

// Page Navigation System - Fixed
function showPage(pageName) {
    console.log('Showing page:', pageName); // Debug log
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const targetPage = document.getElementById(pageName + '-page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
        
        // Update navigation
        document.querySelectorAll('.nav__link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`.nav__link[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Load page-specific content
        switch(pageName) {
            case 'home':
                renderFeaturedProducts();
                break;
            case 'products':
                renderAllProducts();
                break;
            case 'admin-dashboard':
                if (currentUser && currentUser.role === 'admin') {
                    renderAdminDashboard();
                } else {
                    showPage('admin-login');
                }
                break;
            case 'account':
                if (currentUser && currentUser.role === 'customer') {
                    renderCustomerAccount();
                } else {
                    showPage('customer-login');
                }
                break;
        }
    } else {
        console.error('Page not found:', pageName + '-page');
    }
}

// Authentication Functions
function handleCustomerLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const customer = customers.find(c => c.email === email && c.password === password);
    
    if (customer) {
        currentUser = customer;
        localStorage.setItem('dripnest-current-user', JSON.stringify(currentUser));
        updateAuthUI();
        showPage('home');
        showSuccess('Login successful!');
    } else {
        showError('Invalid email or password');
    }
}

function handleCustomerRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (customers.find(c => c.email === email)) {
        showError('Email already exists');
        return;
    }
    
    const newCustomer = {
        id: Date.now(),
        name: name,
        username: email,
        email: email,
        password: password,
        role: 'customer'
    };
    
    customers.push(newCustomer);
    localStorage.setItem('dripnest-customers', JSON.stringify(customers));
    
    currentUser = newCustomer;
    localStorage.setItem('dripnest-current-user', JSON.stringify(currentUser));
    updateAuthUI();
    showPage('home');
    showSuccess('Account created successfully!');
}

function handleAdminLogin(e) {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    
    if (username === sampleData.adminUser.username && password === sampleData.adminUser.password) {
        currentUser = sampleData.adminUser;
        localStorage.setItem('dripnest-current-user', JSON.stringify(currentUser));
        updateAuthUI();
        showPage('admin-dashboard');
        showSuccess('Admin login successful!');
    } else {
        showError('Invalid admin credentials');
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('dripnest-current-user');
    updateAuthUI();
    showPage('home');
    showSuccess('Logged out successfully!');
}

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const userName = document.getElementById('user-name');
    
    if (currentUser) {
        if (authButtons) authButtons.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (userName) userName.textContent = currentUser.name || currentUser.username;
    } else {
        if (authButtons) authButtons.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }
}

// Product Rendering Functions - Fixed
function renderFeaturedProducts() {
    const grid = document.getElementById('featured-products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    // Show first 3 products
    const featuredProducts = products.slice(0, 3);
    
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        grid.appendChild(productCard);
    });
}

function renderAllProducts() {
    const grid = document.getElementById('all-products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = createProductCard(product);
        grid.appendChild(productCard);
    });
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Fixed: Properly bind the product ID to avoid closure issues
    card.addEventListener('click', function() {
        openProductDetail(product.id);
    });
    
    card.innerHTML = `
        <div class="product-card__image">
            ${product.name}
        </div>
        <div class="product-card__content">
            <div class="product-card__category">${product.category}</div>
            <h3 class="product-card__title">${product.name}</h3>
            <div class="product-card__price">$${product.price.toFixed(2)}</div>
            <div class="product-card__stock ${product.inStock ? 'stock-in' : 'stock-out'}">
                ${product.inStock ? `In Stock (${product.stock})` : 'Out of Stock'}
            </div>
        </div>
    `;
    
    return card;
}

function openProductDetail(productId) {
    console.log('Opening product detail for ID:', productId); // Debug log
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Product not found:', productId);
        return;
    }
    
    const productDetail = document.getElementById('product-detail');
    if (!productDetail) {
        console.error('Product detail container not found');
        return;
    }
    
    productDetail.innerHTML = `
        <div class="product-detail__image">
            ${product.name} - Image
        </div>
        <h1 class="product-detail__title">${product.name}</h1>
        <div class="product-detail__category">Category: ${product.category}</div>
        <div class="product-detail__price">$${product.price.toFixed(2)}</div>
        <p class="product-detail__description">${product.description}</p>
        <div class="product-detail__actions">
            ${product.inStock ? 
                `<button class="btn btn--primary btn--lg" onclick="addToCart(${product.id})">Add to Cart</button>` :
                `<button class="btn btn--outline btn--lg" disabled>Out of Stock</button>`
            }
            <button class="btn btn--outline btn--lg" onclick="closeModal('product-modal')">Continue Shopping</button>
        </div>
    `;
    
    openModal('product-modal');
}

// Cart Management - Fixed
function loadCart() {
    const savedCart = localStorage.getItem('dripnest-cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
}

function saveCart() {
    localStorage.setItem('dripnest-cart', JSON.stringify(cart));
}

function addToCart(productId) {
    console.log('Adding to cart:', productId); // Debug log
    const product = products.find(p => p.id === productId);
    if (!product || !product.inStock) {
        showError('Product is not available');
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    showSuccess('Product added to cart!');
    closeModal('product-modal');
}

function updateCartQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartCount();
        renderCart();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
}

function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (!cartCount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'block' : 'none';
}

function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');
    
    if (!cartItems || !cartTotal) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
        cartTotal.textContent = '0.00';
        return;
    }
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item__image">${item.name}</div>
            <div class="cart-item__details">
                <div class="cart-item__title">${item.name}</div>
                <div class="cart-item__price">$${item.price.toFixed(2)}</div>
                <div class="cart-item__quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="cart-item__remove" onclick="removeFromCart(${item.id})">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        `;
        
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = total.toFixed(2);
}

function proceedToCheckout() {
    if (cart.length === 0) {
        showError('Your cart is empty!');
        return;
    }
    
    if (!currentUser || currentUser.role !== 'customer') {
        showError('Please login as a customer to checkout');
        showPage('customer-login');
        closeModal('cart-modal');
        return;
    }
    
    renderCheckout();
    closeModal('cart-modal');
    openModal('checkout-modal');
}

function renderCheckout() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (!checkoutItems || !checkoutTotal) return;
    
    // Pre-fill customer info if available
    if (currentUser) {
        const nameField = document.getElementById('checkout-name');
        const emailField = document.getElementById('checkout-email');
        if (nameField) nameField.value = currentUser.name || '';
        if (emailField) emailField.value = currentUser.email || '';
    }
    
    checkoutItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span>${item.name} × ${item.quantity}</span>
            <span>$${itemTotal.toFixed(2)}</span>
        `;
        
        checkoutItems.appendChild(checkoutItem);
    });
    
    checkoutTotal.textContent = total.toFixed(2);
}

function handleCheckout(e) {
    e.preventDefault();
    
    const orderData = {
        id: Date.now(),
        customerId: currentUser.id,
        customerName: document.getElementById('checkout-name').value,
        customerEmail: document.getElementById('checkout-email').value,
        shippingAddress: document.getElementById('checkout-address').value,
        items: [...cart],
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        date: new Date().toISOString(),
        status: 'Pending'
    };
    
    orders.push(orderData);
    localStorage.setItem('dripnest-orders', JSON.stringify(orders));
    
    // Clear cart
    cart = [];
    saveCart();
    updateCartCount();
    
    closeModal('checkout-modal');
    showSuccess('Order placed successfully!');
    
    // Reset form
    const form = document.getElementById('checkout-form');
    if (form) form.reset();
}

// Admin Functions
function renderAdminDashboard() {
    showAdminSection('products');
}

function showAdminSection(sectionName) {
    // Hide all admin sections
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById('admin-' + sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific content
        switch(sectionName) {
            case 'products':
                renderProductsTable();
                break;
            case 'orders':
                renderOrdersList();
                break;
        }
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status ${product.inStock ? 'status--success' : 'status--error'}">
                    ${product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
            </td>
            <td>
                <div class="table-actions">
                    <button class="btn btn--sm btn--outline" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn--sm ${product.inStock ? 'btn--danger' : 'btn--success'}" 
                            onclick="toggleProductStock(${product.id})">
                        ${product.inStock ? 'Mark Out of Stock' : 'Mark In Stock'}
                    </button>
                    <button class="btn btn--sm btn--danger" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function handleAddProduct(e) {
    e.preventDefault();
    
    const newProduct = {
        id: Date.now(),
        name: document.getElementById('product-name').value,
        category: document.getElementById('product-category').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        description: document.getElementById('product-description').value,
        inStock: parseInt(document.getElementById('product-stock').value) > 0,
        image: 'placeholder.jpg'
    };
    
    products.push(newProduct);
    localStorage.setItem('dripnest-products', JSON.stringify(products));
    
    const form = document.getElementById('add-product-form');
    if (form) form.reset();
    renderProductsTable();
    showSuccess('Product added successfully!');
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Fill edit form
    document.getElementById('edit-product-id').value = product.id;
    document.getElementById('edit-product-name').value = product.name;
    document.getElementById('edit-product-category').value = product.category;
    document.getElementById('edit-product-price').value = product.price;
    document.getElementById('edit-product-stock').value = product.stock;
    document.getElementById('edit-product-description').value = product.description;
    
    openModal('edit-product-modal');
}

function handleEditProduct(e) {
    e.preventDefault();
    
    const productId = parseInt(document.getElementById('edit-product-id').value);
    const productIndex = products.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
        products[productIndex] = {
            ...products[productIndex],
            name: document.getElementById('edit-product-name').value,
            category: document.getElementById('edit-product-category').value,
            price: parseFloat(document.getElementById('edit-product-price').value),
            stock: parseInt(document.getElementById('edit-product-stock').value),
            description: document.getElementById('edit-product-description').value,
            inStock: parseInt(document.getElementById('edit-product-stock').value) > 0
        };
        
        localStorage.setItem('dripnest-products', JSON.stringify(products));
        closeModal('edit-product-modal');
        renderProductsTable();
        showSuccess('Product updated successfully!');
    }
}

function toggleProductStock(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    product.inStock = !product.inStock;
    if (!product.inStock) {
        product.stock = 0;
    }
    
    localStorage.setItem('dripnest-products', JSON.stringify(products));
    renderProductsTable();
    showSuccess(`Product marked ${product.inStock ? 'in stock' : 'out of stock'}!`);
}

function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== productId);
        localStorage.setItem('dripnest-products', JSON.stringify(products));
        renderProductsTable();
        showSuccess('Product deleted successfully!');
    }
}

function renderOrdersList() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        orderDiv.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                <div class="order-total">$${order.total.toFixed(2)}</div>
            </div>
            <div>
                <strong>Customer:</strong> ${order.customerName} (${order.customerEmail})
            </div>
            <div>
                <strong>Items:</strong> ${order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
            </div>
            <div>
                <strong>Status:</strong> <span class="status status--info">${order.status}</span>
            </div>
        `;
        ordersList.appendChild(orderDiv);
    });
}

// Customer Account Functions
function renderCustomerAccount() {
    showAccountSection('profile');
}

function showAccountSection(sectionName) {
    // Hide all account sections
    document.querySelectorAll('.account-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById('account-' + sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Load section-specific content
        switch(sectionName) {
            case 'profile':
                renderProfileInfo();
                break;
            case 'orders':
                renderOrderHistory();
                break;
        }
    }
}

function renderProfileInfo() {
    const profileInfo = document.getElementById('profile-info');
    if (!profileInfo) return;
    
    profileInfo.innerHTML = `
        <h3>Profile Information</h3>
        <p><strong>Name:</strong> ${currentUser.name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${currentUser.email}</p>
        <p><strong>Customer ID:</strong> ${currentUser.id}</p>
        <p><strong>Member since:</strong> ${new Date().toLocaleDateString()}</p>
    `;
}

function renderOrderHistory() {
    const orderHistory = document.getElementById('order-history');
    if (!orderHistory) return;
    
    const customerOrders = orders.filter(order => order.customerId === currentUser.id);
    
    if (customerOrders.length === 0) {
        orderHistory.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    orderHistory.innerHTML = '';
    
    customerOrders.forEach(order => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';
        orderDiv.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.id}</div>
                <div class="order-date">${new Date(order.date).toLocaleDateString()}</div>
                <div class="order-total">$${order.total.toFixed(2)}</div>
            </div>
            <div>
                <strong>Items:</strong> ${order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
            </div>
            <div>
                <strong>Status:</strong> <span class="status status--info">${order.status}</span>
            </div>
        `;
        orderHistory.appendChild(orderDiv);
    });
}

// Product Filtering
function filterProducts() {
    const searchInput = document.getElementById('search-products');
    const categoryFilter = document.getElementById('category-filter');
    
    if (!searchInput || !categoryFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value;
    
    let filteredProducts = products;
    
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (categoryFilterValue) {
        filteredProducts = filteredProducts.filter(product =>
            product.category === categoryFilterValue
        );
    }
    
    const grid = document.getElementById('all-products-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        grid.appendChild(productCard);
    });
}

// Auth Tab Switching
function switchAuthTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const activeContent = document.getElementById(tabName + '-tab');
    if (activeContent) activeContent.classList.add('active');
}

// Modal Management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Utility Functions
function showSuccess(message) {
    const successMessage = document.getElementById('success-message');
    if (successMessage) {
        successMessage.textContent = message;
        openModal('success-modal');
    } else {
        alert(message); // Fallback
    }
}

function showError(message) {
    alert(message); // Simple error display
}

// Global functions for onclick handlers
window.addToCart = addToCart;
window.updateCartQuantity = updateCartQuantity;
window.removeFromCart = removeFromCart;
window.proceedToCheckout = proceedToCheckout;
window.openModal = openModal;
window.closeModal = closeModal;
window.openProductDetail = openProductDetail;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.toggleProductStock = toggleProductStock;
window.showPage = showPage;

// Close modals when clicking backdrop
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal__backdrop')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }
});

// Keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal:not(.hidden)');
        if (openModal) {
            openModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }
});

// Format card number input
document.addEventListener('input', function(e) {
    if (e.target.id === 'checkout-card') {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.replace(/(.{4})/g, '$1 ').trim();
        if (formattedValue.length <= 19) {
            e.target.value = formattedValue;
        }
    }
    
    if (e.target.id === 'checkout-expiry') {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    }
    
    if (e.target.id === 'checkout-cvv') {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value.substring(0, 3);
    }
});