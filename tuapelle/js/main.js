document.addEventListener('DOMContentLoaded', () => {

    // --- Header Scroll Effect ---
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Interactive Hover Effects ---
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Subtle custom property hover variation if needed in future CSS
            btn.style.setProperty('--x', `${x}px`);
            btn.style.setProperty('--y', `${y}px`);
        });
    });

    // --- Scroll Animations (Intersection Observer) ---
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for lists/grids
                if (entry.target.classList.contains('product-card') || entry.target.classList.contains('value-item') || entry.target.classList.contains('treatment-card')) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 150); // 150ms delay per item
                } else {
                    entry.target.classList.add('visible');
                }
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    document.querySelectorAll('.product-card, .value-item, .section-header, .treatment-card').forEach(el => {
        observer.observe(el);
    });

    // --- Smooth Scrolling for Navigation Links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Product Filtering ---
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-grid .product-card');

    if (filterBtns.length > 0 && productCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button state
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.getAttribute('data-filter');

                productCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filter === 'all' || category === filter) {
                        card.style.display = 'block';
                        // Small delay to allow display to apply before fading in
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                            card.classList.add('visible');
                        }, 10);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        card.classList.remove('visible');
                        // Wait for transition before hiding
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 400);
                    }
                });
            });
        });
    }
});

// --- SHOPPING CART LOGIC ---
const Cart = {
    items: [],

    init() {
        // Load from local storage
        const saved = localStorage.getItem('tuapelle_cart');
        if (saved) {
            this.items = JSON.parse(saved);
        }

        this.injectCartDOM();
        this.bindEvents();
        this.render();
        this.updateHeaderCount();
    },

    injectCartDOM() {
        // Check if cart already exists (e.g., hardcoded in checkout)
        if (document.getElementById('cartSidebar')) return;

        const cartHTML = `
            <div class="cart-overlay" id="cartOverlay"></div>
            <div class="cart-sidebar" id="cartSidebar">
                <div class="cart-header">
                    <h2>Your Bag</h2>
                    <button class="close-cart" id="closeCartBtn">&times;</button>
                </div>
                <div class="cart-items" id="cartItemsContainer">
                    <!-- Items rendered here -->
                </div>
                <div class="cart-footer">
                    <div class="cart-subtotal">
                        <span>Subtotal</span>
                        <span id="cartSubtotal">$0.00</span>
                    </div>
                    <a href="checkout.html" class="btn btn-primary cart-checkout-btn">Checkout</a>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', cartHTML);
    },

    bindEvents() {
        const overlay = document.getElementById('cartOverlay');
        const closeBtn = document.getElementById('closeCartBtn');
        const cartBtnLinks = document.querySelectorAll('.cart-btn');

        // Add To Cart buttons
        document.body.addEventListener('click', (e) => {
            if (e.target.closest('.add-to-cart-btn')) {
                e.preventDefault();
                const btn = e.target.closest('.add-to-cart-btn');
                const id = btn.getAttribute('data-id');
                const name = btn.getAttribute('data-name');
                const price = parseFloat(btn.getAttribute('data-price'));
                const image = btn.getAttribute('data-image');
                if (id && name && price && image) {
                    this.addItem(id, name, price, image);
                }
            }
        });

        if (overlay) overlay.addEventListener('click', () => this.closeCart());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeCart());

        cartBtnLinks.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openCart();
            });
        });
    },

    openCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    },

    closeCart() {
        const sidebar = document.getElementById('cartSidebar');
        const overlay = document.getElementById('cartOverlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    },

    addItem(id, name, price, image) {
        const existingItem = this.items.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.items.push({ id, name, price, image, quantity: 1 });
        }
        this.saveAndRender();
        this.openCart();
    },

    updateQuantity(id, delta) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(id);
            } else {
                this.saveAndRender();
            }
        }
    },

    removeItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.saveAndRender();
    },

    saveAndRender() {
        localStorage.setItem('tuapelle_cart', JSON.stringify(this.items));
        this.render();
        this.updateHeaderCount();

        // Custom event for checkout page to listen to
        document.dispatchEvent(new CustomEvent('cartUpdated', { detail: this.items }));
    },

    updateHeaderCount() {
        const count = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const cartBtns = document.querySelectorAll('.cart-btn');
        cartBtns.forEach(btn => {
            btn.textContent = `Cart (${count})`;
        });
    },

    render() {
        const container = document.getElementById('cartItemsContainer');
        const subtotalEl = document.getElementById('cartSubtotal');

        // Checkout specific elements
        const checkoutList = document.getElementById('checkoutItemsList');
        const checkSubtotal = document.getElementById('checkoutSubtotal');
        const checkTaxes = document.getElementById('checkoutTaxes');
        const checkTotal = document.getElementById('checkoutTotal');

        let subtotal = 0;

        // Calculate subtotal
        this.items.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        // Update Cart Sidebar if it exists
        if (container) {
            container.innerHTML = '';
            if (this.items.length === 0) {
                container.innerHTML = '<p class="cart-empty-msg">Your bag is empty.</p>';
            } else {
                this.items.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'cart-item';
                    itemEl.innerHTML = `
                        <div class="cart-item-img" style="background-image: url('${item.image}')"></div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-title">${item.name}</h4>
                            <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                            <div class="cart-item-controls">
                                <button class="qty-btn dec-btn" data-id="${item.id}">-</button>
                                <span>${item.quantity}</span>
                                <button class="qty-btn inc-btn" data-id="${item.id}">+</button>
                                <button class="remove-item" data-id="${item.id}">Remove</button>
                            </div>
                        </div>
                    `;
                    container.appendChild(itemEl);
                });

                container.querySelectorAll('.dec-btn').forEach(btn => btn.addEventListener('click', () => this.updateQuantity(btn.getAttribute('data-id'), -1)));
                container.querySelectorAll('.inc-btn').forEach(btn => btn.addEventListener('click', () => this.updateQuantity(btn.getAttribute('data-id'), 1)));
                container.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', () => this.removeItem(btn.getAttribute('data-id'))));
            }
            if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        }

        // Update Checkout Page if it exists
        if (checkoutList) {
            checkoutList.innerHTML = '';
            if (this.items.length === 0) {
                checkoutList.innerHTML = '<p class="cart-empty-msg">No items in order.</p>';
            } else {
                this.items.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.className = 'order-summary-item';
                    itemEl.innerHTML = `
                        <div class="order-summary-img" style="background-image: url('${item.image}')">
                            <span class="order-summary-qty">${item.quantity}</span>
                        </div>
                        <div class="order-summary-details">
                            <p class="order-summary-title">${item.name}</p>
                        </div>
                        <div class="order-summary-price">$${(item.price * item.quantity).toFixed(2)}</div>
                    `;
                    checkoutList.appendChild(itemEl);
                });
            }

            if (checkSubtotal) checkSubtotal.textContent = `$${subtotal.toFixed(2)}`;
            const taxes = subtotal * 0.0825; // 8.25% mock tax
            if (checkTaxes) checkTaxes.textContent = `$${taxes.toFixed(2)}`;
            const shipping = subtotal > 0 ? 8.00 : 0;
            if (checkTotal) checkTotal.textContent = `$${(subtotal + taxes + shipping).toFixed(2)}`;
        }
    }
};

// Form submission handler for checkout
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Thank you for your order! This is a demo; payment was not processed.');
            localStorage.removeItem('tuapelle_cart');
            window.location.href = 'index.html';
        });
    }
});

// Initialize Cart
Cart.init();
