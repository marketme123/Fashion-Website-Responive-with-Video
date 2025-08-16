// --- Original Script for navigation bar ---
const bar = document.getElementById('bar');
const nav = document.getElementById('navbar');
const close = document.getElementById('close');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    })
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    })
}

// --- E-commerce Functionality ---

document.addEventListener('DOMContentLoaded', () => {

    // Initialize Data Layer for analytics
    window.dataLayer = window.dataLayer || [];

    // --- Global Cart State ---
    // Load cart from localStorage or start with an empty array
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Function to save the current cart state to localStorage
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    // --- Cart Slider Elements & Functions ---
    const cartSlider = document.getElementById('cart-slider');
    const closeSliderBtn = document.getElementById('close-slider');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartSliderItemsContainer = document.getElementById('cart-slider-items');
    const cartSliderTotalPriceEl = document.getElementById('cart-slider-total-price');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    const openSlider = () => {
        if (cartSlider) cartSlider.classList.add('active');
        if (cartOverlay) cartOverlay.classList.add('active');
    };

    const closeSlider = () => {
        if (cartSlider) cartSlider.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
    };

    const addToCart = (product) => {
        const existingProductIndex = cart.findIndex(item => item.id === product.id);
        if (existingProductIndex > -1) {
            // If product exists, increase quantity
            cart[existingProductIndex].quantity += product.quantity || 1;
        } else {
            // If new product, add it to the cart
            if (!product.quantity) product.quantity = 1;
            cart.push(product);
        }
        
        // Data Layer Push for 'add_to_cart' event
        dataLayer.push({
            event: 'add_to_cart',
            ecommerce: {
                items: [{
                    item_id: product.id,
                    item_name: product.name,
                    price: product.price,
                    quantity: product.quantity || 1
                }]
            }
        });

        saveCart(); // Save updated cart to localStorage
        updateAllCartViews(); // Update all visible cart elements
        openSlider(); // Open the slider to show the item was added
    };

    const updateQuantity = (productId, change) => {
        const productIndex = cart.findIndex(item => item.id === productId);
        if (productIndex > -1) {
            cart[productIndex].quantity += change;
            if (cart[productIndex].quantity <= 0) {
                // If quantity drops to 0 or less, remove the item
                removeItem(productId);
            } else {
                saveCart();
                updateAllCartViews();
            }
        }
    };
    
    const setQuantity = (productId, quantity) => {
        const productIndex = cart.findIndex(item => item.id === productId);
        if (productIndex > -1) {
            if (quantity > 0) {
                 cart[productIndex].quantity = quantity;
            } else {
                removeItem(productId);
            }
            saveCart();
            updateAllCartViews();
        }
    };

    const removeItem = (productId) => {
        const removedItem = cart.find(item => item.id === productId);
        // Create a new cart array excluding the removed item
        cart = cart.filter(item => item.id !== productId);

         // Data Layer Push for 'remove_from_cart' event
        if(removedItem) {
            dataLayer.push({
                event: 'remove_from_cart',
                ecommerce: {
                    items: [{
                        item_id: removedItem.id,
                        item_name: removedItem.name,
                        price: removedItem.price,
                        quantity: removedItem.quantity
                    }]
                }
            });
        }

        saveCart();
        updateAllCartViews();
    };
    
    const clearCart = () => {
        cart = []; // Empty the cart array
        saveCart();
        updateAllCartViews();
    };
    
    const calculateTotal = () => cart.reduce((total, item) => total + item.price * item.quantity, 0);

    // --- Event Listeners Setup ---
    if (closeSliderBtn) closeSliderBtn.addEventListener('click', closeSlider);
    if (cartOverlay) cartOverlay.addEventListener('click', closeSlider);
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear the cart?")) {
                clearCart();
            }
        });
    }

    // Listener for all product grid "Add to Cart" buttons
    document.querySelectorAll('.cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const pro = e.target.closest('.pro');
            addToCart({
                id: pro.dataset.id,
                name: pro.dataset.name,
                price: parseFloat(pro.dataset.price),
                image: pro.dataset.image
            });
        });
    });

    // Listener for the single product page "Add to Cart" button
    const singleAddToCartBtn = document.querySelector('.add-to-cart-single');
    if (singleAddToCartBtn) {
        singleAddToCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const proDetails = e.target.closest('#prodetails');
            const quantity = parseInt(proDetails.querySelector('input[type="number"]').value) || 1;
            addToCart({
                id: proDetails.dataset.id,
                name: proDetails.dataset.name,
                price: parseFloat(proDetails.dataset.price),
                image: proDetails.dataset.image,
                quantity: quantity
            });
        });
    }

    // Event Delegation for Slider Actions (quantity changes, remove)
    if (cartSliderItemsContainer) {
        cartSliderItemsContainer.addEventListener('click', (e) => {
            const target = e.target;
            const productId = target.dataset.id;
            if (target.classList.contains('quantity-btn')) {
                updateQuantity(productId, parseInt(target.dataset.change));
            }
            if (target.classList.contains('remove-item-btn')) {
                removeItem(productId);
            }
        });
    }

    // --- Page-Specific Logic ---
    
    // --- CART PAGE Logic (cart.html) ---
    if (document.getElementById('cart')) {
        const cartTableBody = document.querySelector('#cart tbody');
        const cartSubtotalEl = document.querySelector('#subtotal table tr:nth-child(1) td:nth-child(2)');
        const cartTotalEl = document.querySelector('#subtotal table tr:nth-child(3) td:nth-child(2) strong');
        const proceedToCheckoutBtn = document.querySelector('#subtotal .normal');

        const updateCartPage = () => {
            if (!cartTableBody) return;
            cartTableBody.innerHTML = ''; // Clear the table
            
            // Build table rows from the cart array
            cart.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><a href="#" class="remove-item-main" data-id="${item.id}"><i class="far fa-times-circle"></i></a></td>
                    <td><img src="${item.image}" alt="${item.name}"></td>
                    <td>${item.name}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td><input type="number" value="${item.quantity}" min="1" class="quantity-main" data-id="${item.id}"></td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                `;
                cartTableBody.appendChild(row);
            });
            
            const total = calculateTotal();
            if (cartSubtotalEl) cartSubtotalEl.textContent = `$ ${total.toFixed(2)}`;
            if (cartTotalEl) cartTotalEl.textContent = `$ ${total.toFixed(2)}`;
        };
        
        // Listen for clicks on remove icons within the main cart table
        cartTableBody.addEventListener('click', e => {
            if (e.target.closest('.remove-item-main')) {
                e.preventDefault();
                removeItem(e.target.closest('.remove-item-main').dataset.id);
            }
        });
        
        // Listen for changes in the quantity input fields
        cartTableBody.addEventListener('change', e => {
            if (e.target.classList.contains('quantity-main')) {
                setQuantity(e.target.dataset.id, parseInt(e.target.value));
            }
        });
        
        // Handle "Proceed to Checkout" click
        if (proceedToCheckoutBtn) {
            proceedToCheckoutBtn.addEventListener('click', () => {
                if(cart.length === 0){
                    alert("Your cart is empty. Please add items before proceeding to checkout.");
                    return;
                }
                // Data Layer Push for 'begin_checkout'
                dataLayer.push({
                    event: 'begin_checkout',
                    ecommerce: {
                        items: cart.map(item => ({
                            item_id: item.id,
                            item_name: item.name,
                            price: item.price,
                            quantity: item.quantity
                        })),
                        value: calculateTotal(),
                        currency: 'USD'
                    }
                });
                // We'll create payment.html in the next step
                window.location.href = 'payment.html';
            });
        }
        
        // Data Layer Push for 'view_cart' when the page loads
        dataLayer.push({
            event: 'view_cart',
            ecommerce: {
                items: cart.map(item => ({
                    item_id: item.id,
                    item_name: item.name,
                    price: item.price,
                    quantity: item.quantity
                })),
                value: calculateTotal(),
                currency: 'USD'
            }
        });
        
        // Make the update function globally accessible for this page
        window.updateCartPage = updateCartPage;
    }
    
    // --- Central Update Function ---
    // This function is called anytime the cart changes. It updates ALL cart displays.
    const updateAllCartViews = () => {
        // Update Slider View
        if(cartSliderItemsContainer){
            cartSliderItemsContainer.innerHTML = ''; // Clear slider
            if (cart.length === 0) {
                cartSliderItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            } else {
                // Build slider items from the cart array
                cart.forEach(item => {
                    const itemEl = document.createElement('div');
                    itemEl.classList.add('cart-slider-item');
                    itemEl.innerHTML = `
                        <img src="${item.image}" alt="${item.name}">
                        <div class="cart-slider-item-details">
                            <h5>${item.name}</h5>
                            <p class="price">$${item.price.toFixed(2)}</p>
                            <div class="cart-slider-item-quantity">
                                <button class="quantity-btn" data-id="${item.id}" data-change="-1">-</button>
                                <input type="number" value="${item.quantity}" readonly>
                                <button class="quantity-btn" data-id="${item.id}" data-change="1">+</button>
                            </div>
                        </div>
                        <button class="remove-item-btn" data-id="${item.id}">&times;</button>
                    `;
                    cartSliderItemsContainer.appendChild(itemEl);
                });
            }
            if(cartSliderTotalPriceEl) cartSliderTotalPriceEl.textContent = `$${calculateTotal().toFixed(2)}`;
        }
        
        // Update Cart Page View (if the function is available on the current page)
        if (typeof window.updateCartPage === 'function') {
            window.updateCartPage();
        }
    };

    // Initial Load: Update all views with data from localStorage when the site first loads.
    updateAllCartViews();
});
