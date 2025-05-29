/**
 * Louis Vuitton Endless Summer Ad Component
 * Interactive luxury travel fashion recommendation engine
 * 
 * @component LouisVuittonEndlessSummer
 * @version 1.0.0
 * @author Firsthand Demo Assistant
 * @created 2025-05-29
 */

class LouisVuittonEndlessSummer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        // Component state
        this.currentScreen = 'hero';
        this.selectedDestination = '';
        this.cart = [];
        
        // Product data
        this.products = {
            turkey: [
                {
                    id: 'turkey-1',
                    name: 'Scallop Stripe Cardigan',
                    description: 'This chic button-up cardigan is crafted in a casual cropped, fitted shape from a flexible wool-blend knit in a graphic scalloped striped finish peppered with Monogram Flower motifs.',
                    image: 'https://i.ibb.co/Z6n9byrZ/Chat-GPT-Image-May-29-2025-09-11-15-AM.png',
                    price: ''
                },
                {
                    id: 'turkey-2',
                    name: 'Neverfull MM',
                    description: 'Ideal for city commutes and beyond, the iconic Neverfull MM tote is updated for the season in timeless Monogram denim.',
                    image: 'https://i.ibb.co/j94tbr6x/Chat-GPT-Image-May-29-2025-09-11-20-AM.png',
                    price: ''
                }
            ],
            france: [
                {
                    id: 'france-1',
                    name: 'Silk Sleeveless Top with Monogram Tie',
                    description: 'Sophisticated and Parisian-chic.',
                    image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-scallop-stripe-cardigan%20--FTKC23VRF631_PM1_Worn%20view.png?wid=2400&hei=2400',
                    price: '$2,230'
                },
                {
                    id: 'france-2',
                    name: 'LV Isola Flat Sandals',
                    description: 'Comfortable and elegant for cobblestone streets and boardwalks.',
                    image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-neverfull-mm--M13192_PM2_Front%20view.png?wid=2400&hei=2400',
                    price: '$850'
                }
            ],
            portugal: [
                {
                    id: 'portugal-1',
                    name: 'LV x TM Twist PM',
                    description: 'Reimagined with playful touches from the celebratory re-edition of the Louis Vuitton x Murakami collection, the Twist PM handbag makes a chic, summery statement.',
                    image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-lv-x-tm-twist-pm--M13239_PM2_Front%20view.png?wid=2400&hei=2400',
                    price: ''
                },
                {
                    id: 'portugal-2',
                    name: 'Swing Open Back Ballerina',
                    description: 'The Swing open-back ballerina is a chic, summery style crafted from woven raffia.',
                    image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-swing-open-back-ballerina--ATP001RA95_PM2_Front%20view.png?wid=2400&hei=2400',
                    price: ''
                }
            ],
            italy: [
                {
                    id: 'italy-1',
                    name: 'Scarf Print Shirt Dress',
                    description: 'This breezy shirt dress is cut in an ample oversized fit with batwing sleeves to enhance the voluminous silhouette.',
                    image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-scarf-print-shirt-dress--FTDR42VIO570_PM2_Front%20view.png?wid=2400&hei=2400',
                    price: ''
                },
                {
                    id: 'italy-2',
                    name: 'LV Mare Wedge Sandal',
                    description: 'The LV Mare wedge sandal is crafted from raffia, which gives it a refined, artisanal feel.',
                    image: 'https://us.louisvuitton.com/images/is/image/lv/1/PP_VP_L/louis-vuitton-lv-mare-wedge-sandal--ATG008RA95_PM2_Front%20view.png?wid=2400&hei=2400',
                    price: ''
                }
            ]
        };
        
        this.destinationNames = {
            turkey: 'Oludeniz Beach, Turkey',
            france: 'Bay of Biscay, Biarritz, France',
            portugal: 'Praia da Marinha, Algarve, Portugal',
            italy: 'San Fruttuoso, Liguria, Italy'
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.updateCartDisplay();
    }

    render() {
        const styles = this.getStyles();
        const html = this.getHTML();
        
        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            ${html}
        `;
    }

    getStyles() {
        return `
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap');
            
            :host {
                display: block;
                width: 600px;
                height: 400px;
                font-family: 'Playfair Display', Georgia, serif;
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            .lv-ad-container {
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #FAF8F5 0%, #F5F1EB 100%);
                position: relative;
                overflow: hidden;
                border: 1px solid #E8E0D5;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }

            .lv-ad-container::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-image: 
                    radial-gradient(circle at 20% 30%, rgba(215, 197, 173, 0.1) 1px, transparent 1px),
                    radial-gradient(circle at 70% 80%, rgba(215, 197, 173, 0.08) 1px, transparent 1px),
                    radial-gradient(circle at 45% 60%, rgba(215, 197, 173, 0.06) 1px, transparent 1px);
                background-size: 50px 50px, 80px 80px, 60px 60px;
                pointer-events: none;
            }

            .lv-header {
                position: absolute;
                top: 20px;
                left: 20px;
                z-index: 10;
            }

            .lv-logo {
                font-size: 18px;
                font-weight: 700;
                color: #2B2B2B;
                letter-spacing: 2px;
                margin-bottom: 2px;
            }

            .lv-campaign {
                font-size: 12px;
                color: #8B7355;
                font-weight: 400;
                letter-spacing: 1px;
                font-style: italic;
            }

            .cart-icon {
                position: absolute;
                top: 20px;
                right: 20px;
                width: 32px;
                height: 32px;
                background: rgba(215, 197, 173, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                opacity: 0;
                z-index: 10;
            }

            .cart-icon.visible {
                opacity: 1;
            }

            .cart-icon:hover {
                background: rgba(215, 197, 173, 0.4);
            }

            .cart-count {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #2B2B2B;
                color: white;
                font-size: 10px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .screen {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                padding: 20px;
                display: flex;
                flex-direction: column;
                opacity: 0;
                transform: translateX(100%);
                transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }

            .screen.active {
                opacity: 1;
                transform: translateX(0);
            }

            .hero-screen {
                justify-content: center;
                align-items: center;
                text-align: center;
                background: linear-gradient(rgba(250, 248, 245, 0.9), rgba(245, 241, 235, 0.9)),
                            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="waves" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M0 10 Q5 5 10 10 T20 10" stroke="%23D7C5AD" stroke-width="0.5" fill="none" opacity="0.3"/></pattern></defs><rect width="100" height="100" fill="url(%23waves)"/></svg>');
                background-size: cover;
            }

            .hero-title {
                font-size: 32px;
                font-weight: 600;
                color: #2B2B2B;
                margin-bottom: 16px;
                line-height: 1.2;
            }

            .hero-subtitle {
                font-size: 16px;
                color: #8B7355;
                margin-bottom: 32px;
                max-width: 400px;
                line-height: 1.4;
            }

            .lv-button {
                background: #D7C5AD;
                color: #2B2B2B;
                border: none;
                padding: 14px 28px;
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 1px;
                border-radius: 25px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
                text-transform: uppercase;
            }

            .lv-button:hover {
                background: #C9B89A;
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(215, 197, 173, 0.4);
            }

            .destination-screen .content {
                margin-top: 60px;
            }

            .destination-title {
                font-size: 24px;
                color: #2B2B2B;
                margin-bottom: 24px;
                text-align: center;
            }

            .destinations-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 20px;
            }

            .destination-button {
                background: rgba(255, 255, 255, 0.8);
                border: 2px solid #E8E0D5;
                padding: 16px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                font-size: 13px;
                font-weight: 600;
                color: #2B2B2B;
                backdrop-filter: blur(10px);
            }

            .destination-button:hover {
                border-color: #D7C5AD;
                background: rgba(215, 197, 173, 0.1);
                transform: translateY(-2px);
            }

            .product-screen .content {
                margin-top: 40px;
            }

            .product-title {
                font-size: 20px;
                color: #2B2B2B;
                text-align: center;
                margin-bottom: 6px;
            }

            .product-subtitle {
                font-size: 14px;
                color: #8B7355;
                text-align: center;
                margin-bottom: 24px;
            }

            .products-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 20px;
            }

            .product-card {
                background: rgba(255, 255, 255, 0.6);
                border-radius: 12px;
                padding: 16px;
                text-align: center;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(232, 224, 213, 0.5);
                animation: fadeInUp 0.6s ease forwards;
            }

            .product-card:nth-child(2) {
                animation-delay: 0.1s;
            }

            .product-image {
                width: 120px;
                height: 120px;
                object-fit: cover;
                border-radius: 8px;
                margin-bottom: 12px;
                display: block;
            }

            .image-placeholder {
                width: 120px;
                height: 120px;
                background: linear-gradient(135deg, rgba(215,197,173,0.4), rgba(215,197,173,0.2));
                border-radius: 8px;
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #8B7355;
                font-size: 10px;
                text-align: center;
                margin-bottom: 12px;
                border: 2px dashed rgba(139,115,85,0.3);
            }

            .product-name {
                font-size: 12px;
                font-weight: 600;
                color: #2B2B2B;
                margin-bottom: 8px;
                line-height: 1.3;
            }

            .product-price {
                font-size: 11px;
                color: #8B7355;
                margin-bottom: 12px;
            }

            .add-to-cart {
                background: #2B2B2B;
                color: white;
                border: none;
                padding: 8px 16px;
                font-size: 11px;
                border-radius: 15px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .add-to-cart:hover {
                background: #1A1A1A;
            }

            .add-to-cart.added {
                background: #4CAF50;
            }

            .cart-screen .content {
                margin-top: 60px;
            }

            .cart-title {
                font-size: 24px;
                color: #2B2B2B;
                margin-bottom: 20px;
                text-align: center;
            }

            .cart-items {
                max-height: 200px;
                overflow-y: auto;
            }

            .cart-item {
                display: flex;
                align-items: center;
                padding: 12px;
                background: rgba(255, 255, 255, 0.6);
                border-radius: 8px;
                margin-bottom: 8px;
            }

            .cart-item-image {
                width: 60px;
                height: 60px;
                object-fit: cover;
                border-radius: 4px;
                margin-right: 12px;
            }

            .cart-item-info {
                flex: 1;
            }

            .cart-item-name {
                font-size: 12px;
                font-weight: 600;
                color: #2B2B2B;
                margin-bottom: 4px;
            }

            .cart-item-price {
                font-size: 11px;
                color: #8B7355;
            }

            .remove-item {
                background: none;
                border: none;
                color: #8B7355;
                cursor: pointer;
                font-size: 16px;
                padding: 4px;
            }

            .cart-footer {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #E8E0D5;
            }

            .cart-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }

            .back-button {
                background: rgba(139, 115, 85, 0.2);
                color: #8B7355;
                border: 1px solid #8B7355;
            }

            .back-button:hover {
                background: rgba(139, 115, 85, 0.3);
            }

            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @media (max-width: 640px) {
                :host {
                    width: 100%;
                    max-width: 600px;
                    height: 400px;
                }
            }
        `;
    }

    getHTML() {
        return `
            <div class="lv-ad-container">
                <div class="lv-header">
                    <div class="lv-logo">LOUIS VUITTON</div>
                    <div class="lv-campaign">Summer Odyssey</div>
                </div>

                <div class="cart-icon" data-action="show-cart">
                    🛍️
                    <div class="cart-count">0</div>
                </div>

                <div class="screen hero-screen active">
                    <h1 class="hero-title">Where Will Summer Take You?</h1>
                    <p class="hero-subtitle">Style your wardrobe for Europe's most luxurious coasts.</p>
                    <button class="lv-button" data-action="show-destinations">Choose Your Destination</button>
                </div>

                <div class="screen destination-screen">
                    <div class="content">
                        <h2 class="destination-title">Select your destination to explore a curated summer look:</h2>
                        <div class="destinations-grid">
                            <div class="destination-button" data-destination="turkey">
                                Oludeniz Beach<br>Turkey
                            </div>
                            <div class="destination-button" data-destination="france">
                                Bay of Biscay<br>Biarritz, France
                            </div>
                            <div class="destination-button" data-destination="portugal">
                                Praia da Marinha<br>Algarve, Portugal
                            </div>
                            <div class="destination-button" data-destination="italy">
                                San Fruttuoso<br>Liguria, Italy
                            </div>
                        </div>
                    </div>
                </div>

                <div class="screen product-screen">
                    <div class="content">
                        <h2 class="product-title">Indulge in the Elegance of Summer Journeys</h2>
                        <p class="product-subtitle">Style your wardrobe for your selected destination</p>
                        <div class="products-grid"></div>
                        <div style="text-align: center; margin-top: 20px;">
                            <button class="lv-button back-button" data-action="show-destinations">← Back to Destinations</button>
                        </div>
                    </div>
                </div>

                <div class="screen cart-screen">
                    <div class="content">
                        <h2 class="cart-title">Your Summer Selection</h2>
                        <div class="cart-items"></div>
                        <div class="cart-footer">
                            <div class="cart-buttons">
                                <button class="lv-button back-button" data-action="show-destinations">Continue Shopping</button>
                                <button class="lv-button" data-action="visit-site">Shop on LouisVuitton.com</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            const destination = e.target.getAttribute('data-destination');
            const productId = e.target.getAttribute('data-product-id');

            switch (action) {
                case 'show-destinations':
                    this.showDestinations();
                    break;
                case 'show-cart':
                    this.showCart();
                    break;
                case 'visit-site':
                    window.open('https://louisvuitton.com', '_blank');
                    break;
                case 'add-to-cart':
                    this.addToCart(productId, e.target);
                    break;
                case 'remove-from-cart':
                    this.removeFromCart(productId);
                    break;
            }

            if (destination) {
                this.showProducts(destination);
            }
        });
    }

    showScreen(screenClass) {
        const screens = this.shadowRoot.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const targetScreen = this.shadowRoot.querySelector(`.${screenClass}`);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    }

    showDestinations() {
        this.showScreen('destination-screen');
        this.currentScreen = 'destination';
    }

    showProducts(destination) {
        this.selectedDestination = destination;
        const productsGrid = this.shadowRoot.querySelector('.products-grid');
        const subtitle = this.shadowRoot.querySelector('.product-subtitle');
        
        subtitle.textContent = `Style your wardrobe for ${this.destinationNames[destination]}`;
        
        productsGrid.innerHTML = '';
        
        const destinationProducts = this.products[destination];
        destinationProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            
            productCard.innerHTML = `
                <img class="product-image" 
                     src="${product.image}" 
                     alt="${product.name}"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="image-placeholder" style="display:none;">
                    <div style="font-weight:600; margin-bottom:4px;">LOUIS VUITTON</div>
                    <div style="line-height:1.2;">${product.name}</div>
                </div>
                <div class="product-name">${product.name}</div>
                ${product.price ? `<div class="product-price">${product.price}</div>` : ''}
                <button class="add-to-cart" data-action="add-to-cart" data-product-id="${product.id}">Add to Cart</button>
            `;
            
            productsGrid.appendChild(productCard);
        });
        
        this.showScreen('product-screen');
        this.currentScreen = 'product';
    }

    addToCart(productId, button) {
        let product = null;
        for (const destination in this.products) {
            const found = this.products[destination].find(p => p.id === productId);
            if (found) {
                product = found;
                break;
            }
        }
        
        if (product && !this.cart.find(item => item.id === productId)) {
            this.cart.push(product);
            this.updateCartDisplay();
            
            button.textContent = '✓ Added';
            button.classList.add('added');
            button.disabled = true;
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartDisplay();
        this.renderCart();
        
        const addButtons = this.shadowRoot.querySelectorAll(`[data-product-id="${productId}"]`);
        addButtons.forEach(button => {
            if (button.getAttribute('data-action') === 'add-to-cart') {
                button.textContent = 'Add to Cart';
                button.classList.remove('added');
                button.disabled = false;
            }
        });
    }

    updateCartDisplay() {
        const cartIcon = this.shadowRoot.querySelector('.cart-icon');
        const cartCount = this.shadowRoot.querySelector('.cart-count');
        
        cartCount.textContent = this.cart.length;
        
        if (this.cart.length > 0) {
            cartIcon.classList.add('visible');
        } else {
            cartIcon.classList.remove('visible');
        }
    }

    showCart() {
        if (this.cart.length === 0) return;
        
        this.renderCart();
        this.showScreen('cart-screen');
        this.currentScreen = 'cart';
    }

    renderCart() {
        const cartItems = this.shadowRoot.querySelector('.cart-items');
        cartItems.innerHTML = '';
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<div style="text-align: center; color: #8B7355; padding: 40px;">Your cart is empty</div>';
            return;
        }
        
        this.cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="cart-image-placeholder" style="display:none; width:60px; height:60px; background:linear-gradient(135deg, rgba(215,197,173,0.4), rgba(215,197,173,0.2)); border-radius:4px; display:flex; align-items:center; justify-content:center; color:#8B7355; font-size:8px; text-align:center; margin-right:12px; border: 1px dashed rgba(139,115,85,0.3);">
                    <div>LV</div>
                </div>
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">${item.price}</div>
                </div>
                <button class="remove-item" data-action="remove-from-cart" data-product-id="${item.id}">×</button>
            `;
            cartItems.appendChild(cartItem);
        });
    }
}

// Export for component loader - DO NOT use customElements.define() due to injection context issues
// The component is rendered via direct HTML injection in shadow-dom-injector.js

// Make available globally and for module systems
if (typeof window !== 'undefined') {
  window.LouisVuittonEndlessSummer = LouisVuittonEndlessSummer;
}

export default LouisVuittonEndlessSummer;