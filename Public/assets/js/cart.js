// Cart management functionality

// Initialize cart
function initCart() {
    if (!localStorage.getItem('cart')) {
        localStorage.setItem('cart', JSON.stringify([]));
    }
}

// Get cart items
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

// Add item to cart
function addToCart(eventId, teamMembers = [], teamId = null, teamStatus = null) {
    const cart = getCart();
    const event = getEventById(eventId);
    
    if (!event) {
        showToast('Event not found');
        return false;
    }
    
    // Check if event is already in cart
    if (cart.some(item => item.eventId === eventId && item.type === 'event')) {
        showToast('Event is already in your cart');
        return false;
    }
    
    // Add to cart
    cart.push({
        type: 'event',
        eventId,
        name: event.title,
        price: event.price,
        eventType: event.type,
        teamMembers: event.type === 'team' ? teamMembers : [],
        teamId: event.type === 'team' ? teamId : null,
        teamStatus: event.type === 'team' ? teamStatus : null
    });
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast('Added to cart successfully!');
    return true;
}

// Remove item from cart
function removeFromCart(eventId) {
    let cart = getCart();
    cart = cart.filter(item => item.eventId !== eventId);
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast('Removed from cart');
    
    // Add event back to available list if it's a team event
    const event = getEventById(eventId);
    if (event && event.type === 'team') {
        addEventToList(event);
    }
    
    return cart;
}

// Add event back to available list
function addEventToList(event) {
    const eventsGrid = document.getElementById('events-grid');
    
    // Remove the "no events" message if it exists
    if (eventsGrid.innerHTML.includes('No events available')) {
        eventsGrid.innerHTML = '';
    }
    
    // Check if event already exists in the list
    const existingEvents = eventsGrid.querySelectorAll('.event-card');
    let eventExists = false;
    
    existingEvents.forEach(card => {
        const cardEventId = card.querySelector('.event-action').getAttribute('data-event-id');
        if (cardEventId == event.id) {
            eventExists = true;
        }
    });
    
    // Add event if it doesn't already exist
    if (!eventExists) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        eventCard.innerHTML = `
            <div class="event-image" style="background-image: url('${event.image}')"></div>
            <div class="event-details">
                <h3 class="event-title">${event.title}</h3>
                <p class="event-description">${event.description}</p>
                <div class="event-meta">
                    <span class="event-category">${event.category}</span>
                    <span class="event-price">₹${event.price}</span>
                </div>
                <div class="event-meta mt-20">
                    <button class="event-action" data-event-id="${event.id}">Add to Cart</button>
                </div>
            </div>
        `;
        eventsGrid.appendChild(eventCard);
        
        // Set up event action button
        eventCard.querySelector('.event-action').addEventListener('click', function() {
            const eventId = this.getAttribute('data-event-id');
            handleEventAction(eventId);
        });
    }
}

// Calculate cart total
function calculateTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.price, 0);
}

// Clear cart
function clearCart() {
    localStorage.setItem('cart', JSON.stringify([]));
}