// All import statements are at the top of the file.
import * as api from './api.js';
import { sendOTP, verifyOTP, validatePassword } from './auth.js';

// --- CONFIGURATION ---
const API_BASE_URL = 'https://saviskar.co.in'; // Correct PHP backend address

// --- HELPER & DATA FUNCTIONS ---

let eventsData = [];

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            return resolve(); // Script already loaded
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function fetchAndSetEvents() {
    console.log('Fetching events from the database via API...');
    try {
        const response = await fetch(`${PHP_API_BASE_URL}/get_events.php`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        eventsData = await response.json();
    } catch (error) {
        console.error("Could not fetch events:", error);
        eventsData = [];
        const eventsGrid = document.getElementById('events-grid');
        if (eventsGrid) eventsGrid.innerHTML = '<p class="no-events-message">Could not load events. Please ensure the server is running.</p>';
    }
}


// --- Client-Side Data Handling ---
function getEventById(id) {
    return eventsData.find(event => event.id == id);
}

function getEventsByCategory(category) {
    let filteredEvents;
    if (category === 'all' || !eventsData) {
        filteredEvents = [...eventsData];
    } else {
        filteredEvents = eventsData.filter(event => event.category.toLowerCase() === category.toLowerCase());
    }
    filteredEvents.sort((a, b) => a.title.localeCompare(b.title));
    return filteredEvents;
}

function searchEvents(query) {
    if (!eventsData) return [];
    const lowerCaseQuery = query.toLowerCase();
    const foundEvents = eventsData.filter(event => event.title.toLowerCase().includes(lowerCaseQuery));
    foundEvents.sort((a, b) => a.title.localeCompare(b.title));
    return foundEvents;
}


/**
 * ===================================================================
 * CART & MY EVENTS HELPER FUNCTIONS
 * ===================================================================
 */

function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function clearCart() { localStorage.setItem('cart', JSON.stringify([])); }

function getMyEventsIds() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return new Set();

    const cart = getCart();
    const receiptData = JSON.parse(localStorage.getItem(`receiptData_${currentUser.id}`) || '[]');
    
    const cartEventIds = cart.filter(item => item.type === 'event').map(item => String(item.eventId));
    const receiptEventIds = receiptData.filter(item => item.type === 'event').map(item => String(item.eventId));

    return new Set([...cartEventIds, ...receiptEventIds]);
}


function addToCart(eventId, teamMembers = [], teamId = null, teamStatus = null) {
    const cart = getCart();
    const event = getEventById(eventId);
    if (event) {
        const newItem = { id: 'event-' + eventId, eventId: event.id, name: event.title, price: event.price, type: 'event', teamId, teamMembers, teamStatus };
        cart.push(newItem);
        localStorage.setItem('cart', JSON.stringify(cart));
        showToast(`${event.title} added to cart!`);
    }
}

function addAccommodationToCart(days, price) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const name = `Accommodation - ${days === 'both' ? '2 Day Package' : `1 Day Package`}`;
    let cart = getCart();
    cart = cart.filter(item => item.type !== 'accommodation');
    const finalPrice = currentUser?.is_faculty == true ? 0 : price;
    cart.push({ id: 'acc-' + days, type: 'accommodation', name: name, price: finalPrice, days });
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast('Accommodation updated in cart!');
}

function removeAccommodationFromCart() {
    let cart = getCart();
    const accommodationInCart = cart.some(item => item.type === 'accommodation');
    
    if (accommodationInCart) {
        cart = cart.filter(item => item.type !== 'accommodation');
        localStorage.setItem('cart', JSON.stringify(cart));
        showToast('Accommodation removed from cart.');
    }
}

function removeFromCart(itemId) {
    let cart = getCart();
    const itemToRemove = cart.find(item => item.id === itemId);
    if (itemToRemove) {
        cart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(cart));
        showToast(`${itemToRemove.name} removed from cart.`);
    }
}

function calculateTotal(cartData) {
    const cart = cartData || getCart();
    return cart.reduce((total, item) => {
        let price = 0;
        // Only add the price if it's NOT a team event for a non-leader member
        if (!(item.type === 'event' && item.teamId && item.teamStatus !== 'leader')) {
            price = parseFloat(item.price) || 0;
        }
        return total + price;
    }, 0);
}

function userHasBothDaysPass(currentUser) {
    if (!currentUser) return false;
    const currentCart = getCart();
    if (currentCart.some(item => item.id === 'acc-both')) return true;
    const receiptDataString = localStorage.getItem(`receiptData_${currentUser.id}`);
    if (receiptDataString) {
        const receiptData = JSON.parse(receiptDataString);
        if (receiptData.some(item => item.id === 'acc-both')) return true;
    }
    return false;
}

/**
 * ===================================================================
 * TEAM REQUEST NOTIFICATION SYSTEM
 * ===================================================================
 */

async function fetchAndDisplayPendingRequests() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;

    try {
        const response = await fetch(`${PHP_API_BASE_URL}/get_pending_requests.php?userId=${currentUser.id}`);
        const requests = await response.json();
        
        localStorage.setItem('pendingRequests', JSON.stringify(requests));
        renderPendingRequests();
    } catch (error) {
        console.error("Failed to fetch pending requests:", error);
    }
}

function renderPendingRequests() {
    const requests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    if (requests.length === 0) {
        panel.classList.add('hidden');
        return;
    }

    panel.classList.remove('hidden');
    panel.innerHTML = `<h4 class="notification-title">Pending Join Requests</h4>`;

    requests.forEach(req => {
        const item = document.createElement('div');
        item.className = 'notification-item';
        item.innerHTML = `
            <p><strong>${req.memberName}</strong> wants to join team <strong>${req.teamCode}</strong></p>
            <p>for the event: <em>${req.eventTitle}</em></p>
            <div class="notification-actions">
                <button class="btn-accept" data-member-id="${req.memberId}" data-team-code="${req.teamCode}">Accept</button>
                <button class="btn-decline" data-member-id="${req.memberId}" data-team-code="${req.teamCode}">Decline</button>
            </div>
        `;
        panel.appendChild(item);
    });
}

async function handleJoinRequestAction(memberId, teamCode, action) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    await fetch(`${PHP_API_BASE_URL}/handle_join_request.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, teamCode, action, currentUserId: currentUser.id })
    });

    let requests = JSON.parse(localStorage.getItem('pendingRequests') || '[]');
    requests = requests.filter(req => !(req.memberId == memberId && req.teamCode == teamCode));
    localStorage.setItem('pendingRequests', JSON.stringify(requests));
    renderPendingRequests();

    showToast(`Request ${action}ed successfully.`);
}

/**
 * ===================================================================
 * MAIN APPLICATION CONTROLLER
 * ===================================================================
 */

function generateCollegeCode(name) {
    if (!name || typeof name !== 'string') return 'XXXX';
    const stopWords = new Set(['of', 'the', 'and', 'in', 'at', 'a', 'an']);
    const acronym = name
        .replace(/,/g, ' ')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .filter(word => !stopWords.has(word.toLowerCase()))
        .map(word => {
            if (word.length > 1 && word === word.toUpperCase()) {
                return word;
            }
            return word[0];
        })
        .join('');
    return acronym.substring(0, 4).toUpperCase();
}

function generateStateCode(name) {
    if (!name || typeof name !== 'string') return 'XXX';
    return name.substring(0, 3).toUpperCase().padEnd(3, 'X');
}


function updateHeaderInfo() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const greetingEl = document.getElementById('header-greeting');
    const tokenEl = document.getElementById('token-id-display');

    if (currentUser && greetingEl && tokenEl) {
        greetingEl.textContent = `Hey, ${currentUser.name || 'Participant'}!`;
        
        let label = "Token: ";
        let tokenValue = `SVSK${currentUser.id.toString().padStart(4, '0')}`;

        if (currentUser.is_faculty == true) {
            label = "Faculty ID: ";
            if (currentUser.state && currentUser.college) {
                const stateCode = generateStateCode(currentUser.state);
                const collegeCode = generateCollegeCode(currentUser.college);
                const facultyId = `F${currentUser.id.toString().padStart(3, '0')}`;
                tokenValue = `SVK25-${stateCode}-${collegeCode}-${facultyId}`;
            }
        } else {
            if (currentUser.state && currentUser.college) {
                const stateCode = generateStateCode(currentUser.state);
                const collegeCode = generateCollegeCode(currentUser.college);
                const userId = currentUser.id.toString().padStart(3, '0');
                tokenValue = `SVK25-${stateCode}-${collegeCode}-${userId}`;
            }
        }
        
        tokenEl.textContent = label + tokenValue;

        greetingEl.classList.remove('hidden');
        tokenEl.parentElement.classList.remove('hidden'); 
    } else if (greetingEl && tokenEl) {
        greetingEl.textContent = '';
        tokenEl.textContent = '';
        greetingEl.classList.add('hidden');
        tokenEl.parentElement.classList.add('hidden');
    }
}

function updateNavLinksVisibility() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    const myEventsLink = document.getElementById('my-events-nav-link');
    const facultyLink = document.getElementById('faculty-dashboard-link');
    const eventsLink = document.getElementById('events-nav-link');
    const cartLink = document.getElementById('cart-nav-link');

    if (myEventsLink) myEventsLink.classList.add('hidden');
    if (facultyLink) facultyLink.classList.add('hidden');
    if (eventsLink) eventsLink.classList.add('hidden');
    if (cartLink) cartLink.classList.add('hidden');

    if (currentUser) {
        if (currentUser.is_faculty == true) {
            if (facultyLink) facultyLink.classList.remove('hidden');
        } 
        else {
            if (eventsLink) eventsLink.classList.remove('hidden');
            if (cartLink) cartLink.classList.remove('hidden');
        }

        if (localStorage.getItem(`registrationCompleted_${currentUser.id}`) === 'true') {
            if (myEventsLink) myEventsLink.classList.remove('hidden');
        }
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    initApp();
    handleUrlParameters();

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem('currentUser'));
    } catch (error) {
        console.error("Error parsing currentUser from localStorage:", error);
        localStorage.removeItem('currentUser');
        currentUser = null;
    }

    if (currentUser) {
        try {
            const savedCartResponse = await fetch(`${PHP_API_BASE_URL}/get_saved_cart.php?userId=${currentUser.id}`);
            if (!savedCartResponse.ok) throw new Error('Failed to fetch saved cart');
            const savedCart = await savedCartResponse.json();

            if (savedCart && savedCart.length > 0) {
                localStorage.setItem('cart', JSON.stringify(savedCart));
                showToast('Your saved cart has been restored!');
            }

            updateHeaderInfo();
            updateNavLinksVisibility();
            await fetchAndDisplayPendingRequests();
            const isCompleted = localStorage.getItem(`registrationCompleted_${currentUser.id}`);

            // --- BUG FIX 1: Correct routing for completed faculty ---
            if (isCompleted === 'true') {
                if (currentUser.is_faculty) {
                    showFacultyDashboardPage(); // Go to dashboard if faculty and completed
                } else {
                    showMyEventsPage(); // Go to my events if student and completed
                }
            } else if (savedCart && savedCart.length > 0) {
                showCartPage();
            } else if (currentUser.name && currentUser.name.trim() !== '') {
                showEventsPage();
            } else {
                showPersonalInfoPage();
            }
        } catch (apiError) {
            console.error("API Error during initial load:", apiError);
            showToast("Could not connect to the server. Please try again later.");
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                 mainContent.innerHTML = `<div class="form-card"><h2 class="form-title">Connection Error</h2><p>We couldn't load your data from the server. Please refresh the page or try again later.</p></div>`;
            }
            updateHeaderInfo();
            updateNavLinksVisibility();
        }
    } else {
        showLandingPage();
    }
});


function initApp() {
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    if (!localStorage.getItem('cart')) localStorage.setItem('cart', JSON.stringify([]));
    
    document.getElementById('main-navbar').addEventListener('click', (e) => {
        if (e.target.matches('.nav-link')) {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            switch (page) {
                case 'personal-info': showPersonalInfoPage(); break;
                case 'events': showEventsPage(); break;
                case 'accommodation': showAccommodationPage(); break;
                case 'my-events': showMyEventsPage(); break;
                case 'faculty-dashboard': showFacultyDashboardPage(); break;
                case 'cart': showCartPage(); break;
            }
        }
    });

    document.getElementById('notifications-panel').addEventListener('click', (e) => {
        if (e.target.matches('.btn-accept')) {
            const { memberId, teamCode } = e.target.dataset;
            handleJoinRequestAction(memberId, teamCode, 'accept');
        }
        if (e.target.matches('.btn-decline')) {
            const { memberId, teamCode } = e.target.dataset;
            handleJoinRequestAction(memberId, teamCode, 'decline');
        }
    });
}

function updateNavbar(activePage) {
    const navbar = document.getElementById('main-navbar');
    const logoutBtnWrapper = document.getElementById('logout-wrapper'); 
    
    document.querySelector('.header').classList.remove('hidden');
    navbar.classList.remove('hidden');
    logoutBtnWrapper.classList.remove('hidden');
    
    navbar.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === activePage) {
            link.classList.add('active');
        }
    });
}

function showLandingPage() {
    document.querySelector('.header').classList.remove('hidden');
    document.getElementById('main-navbar').classList.add('hidden');
    document.getElementById('logout-wrapper').classList.add('hidden');
    
    updateHeaderInfo();
    updateNavLinksVisibility();

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="auth-card">
            <div class="auth-tabs"><div class="auth-tab active" data-tab="login">Login</div><div class="auth-tab" data-tab="signup">Sign Up</div></div>
            <form class="auth-form active" id="login-form"><div class="form-group"><label for="login-email">Email</label><input type="email" id="login-email" class="form-control" placeholder="Enter your email" required></div><div class="form-group"><label for="login-password">Password</label><input type="password" id="login-password" class="form-control" placeholder="Enter your password" required></div><div class="form-group"><button type="submit" class="btn btn-primary">Login</button></div></form>
            <form class="auth-form" id="signup-form"><div class="form-group"><label for="signup-email">Email</label><input type="email" id="signup-email" class="form-control" placeholder="Enter your email" required></div><div class="form-group"><label for="signup-password">Password</label><input type="password" id="signup-password" class="form-control" placeholder="Create a password" required></div><div class="form-group"><label for="confirm-password">Confirm Password</label><input type="password" id="confirm-password" class="form-control" placeholder="Confirm your password" required></div><div class="form-group"><button type="submit" class="btn btn-primary">Sign Up</button></div></form>
        </div>
    `;
    setupAuthTabs();
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
}

function showPersonalInfoPage() {
    updateNavbar('personal-info');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="form-card">
            <h2 class="form-title">Personal Information</h2>
            <form id="personal-info-form">
                <div class="form-row"><div class="form-col"><div class="form-group"><label for="full-name">Full Name</label><input type="text" id="full-name" class="form-control" placeholder="Enter your full name" value="${currentUser?.name || ''}" required></div></div><div class="form-col"><div class="form-group"><label for="email">Email</label><input type="email" id="email" class="form-control" value="${currentUser?.email || ''}" disabled></div></div></div>
                <div class="form-row"><div class="form-col"><div class="form-group"><label for="phone">Phone Number</label><input type="tel" id="phone" class="form-control" placeholder="Enter phone number" value="${currentUser?.phone || ''}" required></div></div><div class="form-col"><div class="form-group"><label for="college">College/Institution</label><input type="text" id="college" class="form-control" placeholder="Enter college name" value="${currentUser?.college || ''}" required></div></div></div>
                <div class="form-row"><div class="form-col"><div class="form-group"><label for="state">State</label><input type="text" id="state" class="form-control" placeholder="Enter your state" value="${currentUser?.state || ''}" required></div></div><div class="form-col"><div class="form-group"><label for="city">City</label><input type="text" id="city" class="form-control" placeholder="Enter your city" value="${currentUser?.city || ''}" required></div></div></div>
                <div class="faculty-toggle"><input type="checkbox" id="is-faculty" ${currentUser?.is_faculty == true ? 'checked' : ''}><label for="is-faculty">Are you Faculty?</label></div>
                <div id="student-fields" class="${currentUser?.is_faculty == true ? 'hidden' : ''}">
                    <div class="form-row"><div class="form-col"><div class="form-group"><label for="year">Year of Study</label><select id="year" class="form-control" ${currentUser?.is_faculty != true ? 'required' : ''}><option value="">Select Year</option><option value="1" ${currentUser?.year == '1' ? 'selected' : ''}>1st</option><option value="2" ${currentUser?.year == '2' ? 'selected' : ''}>2nd</option><option value="3" ${currentUser?.year == '3' ? 'selected' : ''}>3rd</option><option value="4" ${currentUser?.year == '4' ? 'selected' : ''}>4th</option><option value="5" ${currentUser?.year == '5' ? 'selected' : ''}>5th</option></select></div></div><div class="form-col"><div class="form-group"><label for="course">Course</label><input type="text" id="course" class="form-control" placeholder="Enter your course" value="${currentUser?.course || ''}" ${currentUser?.is_faculty != true ? 'required' : ''}></div></div></div>
                    <div class="form-row"><div class="form-col"><div class="form-group"><label for="fid">Faculty Incharge ID</label><input type="text" id="fid" class="form-control" placeholder="e.g. F004" value="${currentUser?.faculty_incharge_id || ''}"></div></div></div>
                </div>
                <div class="form-group text-center"><button type="submit" class="btn btn-primary">Save & Continue</button></div>
            </form>
        </div>
    `;
    document.getElementById('is-faculty').addEventListener('change', function() {
        const studentFields = document.getElementById('student-fields');
        studentFields.classList.toggle('hidden', this.checked);
        document.getElementById('year').required = !this.checked;
        document.getElementById('course').required = !this.checked;
    });
    document.getElementById('personal-info-form').addEventListener('submit', handlePersonalInfoSubmit);
}


async function showEventsPage() {
    updateNavbar('events');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.is_faculty == true) {
        showAccommodationPage();
        return;
    }
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="events-container">
            <h2 class="form-title">Register for New Events</h2>
            <div class="events-header">
                <div class="category-tabs">
                    <div class="category-tab active" data-category="all">All</div>
                    <div class="category-tab" data-category="cultural">Cultural</div>
                    <div class="category-tab" data-category="technical">Technical</div>
                    <div class="category-tab" data-category="non-technical">Non-Technical</div>
                </div>
                <div class="search-box">
                    <input id="events-search" class="form-control" placeholder="Search new events...">
                </div>
            </div>
            <div id="events-grid" class="events-grid"><p>Loading...</p></div>
            <div class="page-actions">
                <button id="back-to-personal-info" class="btn btn-secondary">Back</button>
                <button id="proceed-to-accommodation" class="btn btn-primary">Proceed</button>
            </div>
        </div>
    `;
    
    const eventsGrid = document.getElementById('events-grid');
    eventsGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.event-action');
        if (button) {
            const eventId = button.dataset.eventId;
            handleEventAction(eventId);
        }
    });

    await fetchAndSetEvents();
    loadEvents();
    setupCategoryTabs();
    
    document.getElementById('back-to-personal-info').addEventListener('click', showPersonalInfoPage);
    document.getElementById('events-search').addEventListener('input', (e) => filterEventsBySearch(e.target.value));
    document.getElementById('proceed-to-accommodation').addEventListener('click', showAccommodationPage);
}

function showAccommodationPage() {
    updateNavbar('accommodation');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    // --- BUG FIX 2: Block page if user already has 2-day pass ---
    if (userHasBothDaysPass(currentUser)) {
        showToast("You have already registered for the 2-day accommodation package.");
        showMyEventsPage(); // Redirect them to their registrations
        return;
    }

    const isFaculty = currentUser?.is_faculty == true;
    
    const receiptData = JSON.parse(localStorage.getItem(`receiptData_${currentUser.id}`) || '[]');
    const cart = getCart();
    const finalizedAcc = receiptData.find(item => item.type === 'accommodation');
    const cartAcc = cart.find(item => item.type === 'accommodation');
    const currentAccommodation = finalizedAcc || cartAcc;

    const wantsAccommodation = !!currentAccommodation;
    const selectedDays = currentAccommodation ? currentAccommodation.days : null;

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="accommodation-card">
            <h2 class="form-title">Accommodation</h2>
            <div class="accommodation-toggle">
                <input type="checkbox" id="wants-accommodation" ${wantsAccommodation ? 'checked' : ''}>
                <label for="wants-accommodation">I need accommodation</label>
            </div>
            <div id="accommodation-options" class="${wantsAccommodation ? '' : 'hidden'}">
                <div class="accommodation-option">
                    <h3>1 Day Package</h3>
                    <p class="price">₹499</p>
                    <p class="includes">Includes: 3 Meals, Wi-Fi, Security, Star Night Pass</p>
                    <button class="btn ${selectedDays == '1' ? 'btn-primary' : 'btn-secondary'} add-accommodation" data-days="1" data-price="499">
                        ${selectedDays == '1' ? 'Selected' : 'Select'}
                    </button>
                </div>
                <div class="accommodation-option">
                    <h3>2 Day Package</h3>
                    <p class="price">₹999</p>
                    <p class="includes">Includes: 6 Meals, Wi-Fi, Security, 2 Star Night Passes</p>
                    <button class="btn ${selectedDays == 'both' ? 'btn-primary' : 'btn-secondary'} add-accommodation" data-days="both" data-price="999">
                        ${selectedDays == 'both' ? 'Selected' : 'Select'}
                    </button>
                </div>
            </div>
            <div class="page-actions">
                <button id="back-button" class="btn btn-secondary">Back</button>
                <button id="proceed-button" class="btn btn-primary">Proceed</button>
            </div>
        </div>
    `;

    document.getElementById('wants-accommodation').addEventListener('change', function() {
        document.getElementById('accommodation-options').classList.toggle('hidden', !this.checked);
        if (!this.checked) {
            removeAccommodationFromCart();
            showAccommodationPage();
        }
    });

    document.querySelectorAll('.add-accommodation').forEach(button => {
        button.addEventListener('click', function() {
            addAccommodationToCart(this.dataset.days, parseInt(this.dataset.price));
            showAccommodationPage();
        });
    });

    if (isFaculty) {
        document.getElementById('back-button').addEventListener('click', showPersonalInfoPage);
        document.getElementById('proceed-button').addEventListener('click', finalizeRegistration);
    } else {
        document.getElementById('back-button').addEventListener('click', showEventsPage);
        document.getElementById('proceed-button').addEventListener('click', showCartPage);
    }
}

function showCartPage() {
    updateNavbar('cart');
    const cart = getCart();
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="cart-container">
            <h2 class="form-title">Your Cart</h2>
            <div id="cart-items">${cart.length === 0 ? '<p>Your cart is empty</p>' : ''}</div>
            <div id="cart-total"></div>
            <div class="page-actions">
                <button id="back-button" class="btn btn-secondary">Back</button>
                <button id="lock-cart-btn" class="btn btn-secondary ${cart.length === 0 ? 'hidden' : ''}">Save for Later</button>
                <button id="payment-btn" class="btn btn-primary inactive ${cart.length === 0 ? 'hidden' : ''}">Proceed to Payment</button>
            </div>
        </div>
    `;
    renderCartItems();
    
    const backButton = document.getElementById('back-button');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));

    if (userHasBothDaysPass(currentUser)) {
        backButton.addEventListener('click', showEventsPage);
    } else {
        backButton.addEventListener('click', showAccommodationPage);
    }

    document.getElementById('lock-cart-btn').addEventListener('click', handleLockCart);

    document.getElementById('payment-btn').addEventListener('click', () => {
        showToast('Payment gateway opening soon!');
    });
}

function showMyEventsPage() {
    updateNavbar('my-events');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const cart = getCart();
    const receiptData = JSON.parse(localStorage.getItem(`receiptData_${currentUser.id}`) || '[]');

    const allItems = new Map();

    receiptData.forEach(item => {
        allItems.set(item.id, { ...item, status: 'Registered' });
    });

    cart.forEach(item => {
        if (!allItems.has(item.id)) {
            allItems.set(item.id, { ...item, status: 'In Cart' });
        }
    });

    const itemsList = Array.from(allItems.values());

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div class="cart-container">
            <h2 class="form-title">My Registrations</h2>
            <p>This shows all items in your cart and from completed registrations.</p>
            <div id="my-events-list" class="mt-20">
                ${itemsList.length === 0 ? '<p>You have not selected any items yet.</p>' : ''}
            </div>
            <div class="page-actions">
                ${receiptData.length > 0 ? `<button id="download-receipt" class="btn btn-primary">Download Final Receipt</button>` : ''}
            </div>
        </div>
    `;

    if (itemsList.length > 0) {
        const listContainer = document.getElementById('my-events-list');
        itemsList.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            const teamInfoHTML = item.teamId 
                ? `<p class="my-events-team-info">Team ID: <b>${item.teamId}</b> (Status: ${item.teamStatus})</p>` 
                : '';
            
            let priceDisplay;
            if (item.type === 'event' && item.teamId && item.teamStatus !== 'leader') {
                priceDisplay = 'Paid by Leader';
            } else {
                priceDisplay = parseFloat(item.price) === 0 ? 'FREE' : `₹${parseFloat(item.price).toFixed(2)}`;
            }

            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    ${teamInfoHTML}
                </div>
                <div class="cart-item-status">
                    <span class="cart-item-price">${priceDisplay}</span>
                    <p class="team-status-badge ${item.status === 'Registered' ? 'team-status-approved' : 'team-status-pending'}">${item.status}</p>
                </div>
            `;
            listContainer.appendChild(itemElement);
        });
    }

    if (receiptData.length > 0) {
        document.getElementById('download-receipt').addEventListener('click', downloadReceiptAsPDF);
    }
}

async function showFacultyDashboardPage() {
    updateNavbar('faculty-dashboard');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `<div class="cart-container"><h2 class="form-title">Student Registrations</h2><p>Loading student data...</p></div>`;

    try {
        const response = await fetch(`${PHP_API_BASE_URL}/get_faculty_students.php?facultyId=${currentUser.id}`);
        const students = await response.json();

        let studentsHTML = '<p>No students have designated you as their faculty incharge yet.</p>';
        if (students.length > 0) {
            studentsHTML = students.map(student => {
                const studentTotal = calculateTotal(student.cart_data);
                const itemsHTML = student.cart_data.map(item => {
                    let priceText;
                    if (item.type === 'event' && item.teamId && item.teamStatus !== 'leader') {
                        priceText = ' (Paid by Leader)';
                    } else {
                        priceText = ` - ${parseFloat(item.price) === 0 ? 'FREE' : '₹' + item.price}`;
                    }
                    return `<li>${item.name}${priceText}</li>`;
                }).join('');

                return `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <h3>${student.name} (${student.college})</h3>
                            <p>Email: ${student.email}</p>
                            <ul class="student-cart-items">${itemsHTML}</ul>
                        </div>
                        <div class="cart-item-actions">
                            <span class="cart-item-price">Total: ₹${studentTotal.toFixed(2)}</span>
                            <div class="faculty-student-select">
                                <input type="checkbox" class="student-select-checkbox" data-student-id="${student.id}">
                                <label>Select</label>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        mainContent.innerHTML = `
            <div class="cart-container">
                <h2 class="form-title">Student Registrations</h2>
                <p>Review and finalize registrations for students who have listed you as their faculty incharge.</p>
                <div id="student-list" class="mt-20">${studentsHTML}</div>
                <div class="page-actions">
                    <button id="faculty-pay-btn" class="btn btn-primary inactive ${students.length === 0 ? 'hidden' : ''}">Pay for Students</button>
                </div>
            </div>
        `;

        if (students.length > 0) {
            document.getElementById('faculty-pay-btn').addEventListener('click', () => {
                showToast("Payment gateway opening soon!");
            });
        }

    } catch (error) {
        console.error("Failed to load student data:", error);
        mainContent.innerHTML = `<div class="cart-container"><h2 class="form-title">Error</h2><p>Could not load student data.</p></div>`;
    }
}

async function handlePayForSelected() {
    const selectedCheckboxes = document.querySelectorAll('.student-select-checkbox:checked');
    const studentIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.studentId);

    if (studentIds.length === 0) {
        showToast("Please select at least one student to proceed.");
        return;
    }

    try {
        const response = await fetch(`${PHP_API_BASE_URL}/finalize_for_students.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentIds: studentIds })
        });
        const result = await response.json();
        
        if (result.success) {
            showToast("Registrations finalized successfully!");
            showFacultyDashboardPage();
        } else {
            showToast(result.message || "An error occurred.");
        }
    } catch (error) {
        console.error("Payment for students failed:", error);
        showToast("A network error occurred.");
    }
}


async function finalizeRegistration() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const finalCart = getCart();
    if (finalCart.length === 0) { 
        showToast("Your cart is empty.");
        return;
    }
    
    try {
        const response = await fetch(`${PHP_API_BASE_URL}/finalize_registration.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: currentUser, cart: finalCart })
        });

        if (!response.ok) {
            throw new Error(`Server Error: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.success) {
            localStorage.setItem(`registrationCompleted_${currentUser.id}`, 'true');
            localStorage.setItem(`receiptData_${currentUser.id}`, JSON.stringify(finalCart));
            
            if (currentUser.is_faculty == true) {
                showToast("Registration Complete!");
            } else {
                await sendConfirmationEmail(currentUser, finalCart);
            }
            
            clearCart();
            showReceiptPage(true);
        } else {
            showToast(result.message || "Registration failed.");
        }
    } catch (error) {
        console.error("Finalize Registration Error:", error);
        showToast("An error occurred while finalizing. Please try again.");
    }
}

function showReceiptPage(showPaymentNotification = false) {
    updateNavbar('my-events');
    showMyEventsPage();
    if (showPaymentNotification) {
        showToast('Registration finalized! Payments will be opening soon.');
    }
}

async function generatePdfAsBase64(currentUser, cart) {
    try {
        await loadScript("assets/js/lib/jspdf.umd.min.js");
        await loadScript("assets/js/lib/jspdf-autotable.min.js");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        if (typeof doc.autoTable !== 'function') {
            throw new Error("jsPDF-AutoTable plugin did not attach correctly.");
        }

        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Saviskar 2025 Registration Receipt", 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 105, 30, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Participant Details:", 14, 45);
        
        let tokenLabel = "Token ID";
        let tokenValue = `SVSK${currentUser.id.toString().padStart(4, '0')}`;
        if (currentUser.is_faculty == true) {
            tokenLabel = "Faculty ID";
            if(currentUser.state && currentUser.college) {
                const stateCode = generateStateCode(currentUser.state);
                const collegeCode = generateCollegeCode(currentUser.college);
                tokenValue = `SVK25-${stateCode}-${collegeCode}-F${currentUser.id.toString().padStart(3, '0')}`;
            }
        } else if (currentUser.state && currentUser.college) {
            const stateCode = generateStateCode(currentUser.state);
            const collegeCode = generateCollegeCode(currentUser.college);
            tokenValue = `SVK25-${stateCode}-${collegeCode}-${currentUser.id.toString().padStart(3, '0')}`;
        }

        doc.autoTable({
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            body: [
                [tokenLabel, tokenValue],
                ['Name', currentUser.name],
                ['Email', currentUser.email],
                ['College', currentUser.college],
            ],
            columns: [{ header: 'Field' }, { header: 'Detail' }],
        });

        const tableBody = [];
        const events = cart.filter(item => item.type === 'event');
        const accommodation = cart.find(item => item.type === 'accommodation');

        events.forEach(item => {
            let priceText;
            if (item.type === 'event' && item.teamId && item.teamStatus !== 'leader') {
                priceText = 'Paid by Leader';
            } else {
                priceText = parseFloat(item.price) === 0 ? 'FREE' : `₹${parseFloat(item.price).toFixed(2)}`;
            }
            tableBody.push([item.name, priceText]);
        });

        if (accommodation) {
            const priceText = parseFloat(accommodation.price) === 0 ? 'FREE' : `₹${parseFloat(accommodation.price).toFixed(2)}`;
            tableBody.push([accommodation.name, priceText]);
        }

        doc.autoTable({
            startY: doc.lastAutoTable.finalY + 15,
            head: [['Item Description', 'Price']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [39, 174, 96] },
        });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const total = calculateTotal(cart);
        doc.text(`Total Amount: ₹${total.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 15);

        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text("Thank you for registering for Saviskar 2025! We look forward to seeing you.", 105, 280, { align: 'center' });
        
        return doc.output('datauristring').split(',')[1];

    } catch (error) {
        console.error("PDF Generation Failed:", error);
        showToast("Error: Failed to generate PDF content.", 5000);
        return null;
    }
}

async function downloadReceiptAsPDF() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const receiptDataString = localStorage.getItem(`receiptData_${currentUser.id}`);
    const cart = JSON.parse(receiptDataString || '[]');

    if (cart.length === 0) {
        showToast("No finalized items to generate a receipt for.", 3000);
        return;
    }

    const pdfBase64 = await generatePdfAsBase64(currentUser, cart);
    if (pdfBase64) {
        const byteCharacters = atob(pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) { byteNumbers[i] = byteCharacters.charCodeAt(i); }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Saviskar-Receipt-2025.pdf';
        a.click(); URL.revokeObjectURL(a.href);
    }
}

function showToast(message, duration = 3000) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast'; toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showActionableToast({ message, memberName, onAccept, onDecline }) {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast actionable';
    toast.innerHTML = `
        <div class="toast-content">
            <p>${message}</p>
            <strong>${memberName}</strong>
        </div>
        <div class="toast-actions">
            <button class="btn-accept">Accept</button>
            <button class="btn-decline">Decline</button>
        </div>
    `;
    document.body.appendChild(toast);

    const closeToast = () => toast.remove();

    toast.querySelector('.btn-accept').addEventListener('click', () => {
        onAccept();
        closeToast();
    });
    toast.querySelector('.btn-decline').addEventListener('click', () => {
        onDecline();
        closeToast();
    });

    setTimeout(() => toast.classList.add('show'), 10);
}

function setupAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            tabs.forEach(t => t.classList.remove('active')); this.classList.add('active');
            forms.forEach(form => { form.classList.remove('active'); if (form.id === `${tabName}-form`) form.classList.add('active'); });
        });
    });
}
function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            tabs.forEach(t => t.classList.remove('active')); this.classList.add('active');
            filterEvents(category);
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        const response = await fetch(`${PHP_API_BASE_URL}/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (result.success) {
            const user = result.user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            // Instead of reloading, we trigger the main startup logic again
            document.dispatchEvent(new Event('DOMContentLoaded'));
        } else {
            showToast(result.message || 'Login failed.');
        }
    } catch (error) {
        console.error('Login API Error:', error);
        showToast('Could not connect to server.');
    }
}


async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    if (password !== document.getElementById('confirm-password').value) { showToast('Passwords do not match'); return; }
    if (!validatePassword(password)) { showToast('Password invalid.'); return; }
    showToast('Sending verification email...');
    const result = await sendOTP(email);
    if (result.success) {
        showOTPVerification(email, password);
    } else {
        showToast(result.error || 'Could not send OTP.');
    }
}

async function handlePersonalInfoSubmit(e) {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const updatedDetails = {
        id: currentUser.id, name: document.getElementById('full-name').value,
        phone: document.getElementById('phone').value, college: document.getElementById('college').value,
        state: document.getElementById('state').value, city: document.getElementById('city').value,
        is_faculty: document.getElementById('is-faculty').checked, year: document.getElementById('year').value,
        course: document.getElementById('course').value,
        faculty_incharge_id: document.getElementById('fid').value
    };
    try {
        const response = await fetch(`${PHP_API_BASE_URL}/update_user.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDetails)
        });
        const result = await response.json();
        if (result.success) {
            const updatedUser = { ...currentUser, ...updatedDetails };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            updateHeaderInfo();
            showToast('Personal information saved successfully!');
            if (updatedUser.is_faculty) {
                showAccommodationPage();
            } else {
                showEventsPage();
            }
        } else {
            showToast(result.message || "Failed to save information.");
        }
    } catch (error) {
        console.error("Update User API Error:", error);
        showToast("An error occurred. Could not save information.");
    }
}

async function handleLockCart() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const cart = getCart();

    if (!currentUser) {
        showToast("You must be logged in to save your cart.");
        return;
    }

    if (cart.length === 0) {
        showToast("Your cart is already empty.");
        return;
    }

    try {
        const response = await fetch(`${PHP_API_BASE_URL}/save_cart.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, cart: cart })
        });

        if (!response.ok) {
            throw new Error("Server failed to save the cart.");
        }

        const result = await response.json();
        if (result.success) {
            showToast("Cart saved to your account! You can now log out safely.");
        } else {
            showToast(result.message || "Error: Could not save your cart.");
        }
    } catch (error) {
        console.error("Save Cart Error:", error);
        showToast("A network error occurred while saving your cart.");
    }
}


function handleLogout() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        showLandingPage();
        return;
    }
    const receiptData = localStorage.getItem(`receiptData_${currentUser.id}`);
    const completed = localStorage.getItem(`registrationCompleted_${currentUser.id}`);

    localStorage.clear(); 

    if (receiptData) localStorage.setItem(`receiptData_${currentUser.id}`, receiptData);
    if (completed) localStorage.setItem(`registrationCompleted_${currentUser.id}`, completed);
    
    showLandingPage();
    showToast('Logged out successfully');
}

function loadEvents() {
    const events = getEventsByCategory('all');
    renderEvents(events);
}

function renderEvents(eventsToRender) {
    const eventsGrid = document.getElementById('events-grid');
    const myEventsIdSet = getMyEventsIds();
    eventsGrid.innerHTML = '';

    const availableEvents = eventsToRender.filter(event => !myEventsIdSet.has(String(event.id)));

    if (!availableEvents || availableEvents.length === 0) {
        eventsGrid.innerHTML = '<p class="no-events-message">No new events here. Check your "My Events" list!</p>';
        return;
    }
    
    availableEvents.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        const priceDisplay = parseFloat(event.price) === 0 ? 'FREE' : `₹${parseFloat(event.price).toFixed(2)}`;
        eventCard.innerHTML = `
            <div class="event-image" style="background-image: url('${event.image_path}')"></div>
            <div class="event-details">
                <h3>${event.title}</h3>
                <p>${event.description}</p>
                <div class="event-meta">
                    <span>${event.category}</span>
                    <span>${priceDisplay}</span>
                </div>
                <div class="event-meta mt-20">
                    <button class="event-action" data-event-id="${event.id}">Add to Cart</button>
                </div>
            </div>`;
        eventsGrid.appendChild(eventCard);
    });
}

function refreshEventsDisplay() {
    const currentCategory = document.querySelector('.category-tab.active').dataset.category;
    const currentSearch = document.getElementById('events-search').value;

    let events = getEventsByCategory(currentCategory);

    if (currentSearch) {
        const lowerCaseQuery = currentSearch.toLowerCase();
        events = events.filter(event => event.title.toLowerCase().includes(lowerCaseQuery));
    }

    renderEvents(events);
}

function handleEventAction(eventId) {
    const event = getEventById(eventId);
    if (!event) {
        console.error("ERROR: Event not found in eventsData array! Function will stop.");
        return;
    }
    if (event.type === 'team') {
        showTeamRegistrationModal(event);
    } else {
        addToCart(eventId);
        refreshEventsDisplay();
    }
}
function showTeamRegistrationModal(event) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-close">&times;</div>
            <h2>Team Registration</h2>
            <p class="modal-subtitle">${event.title}</p>
            <p class="modal-description">This event requires a team of ${event.team_size} members.</p>
            <div class="team-options">
                <div class="team-option">
                    <h3>Create a New Team</h3>
                    <p>You will become the team leader.</p>
                    <input id="team-name-input" class="form-control mb-20" placeholder="Enter Team Name (Optional)">
                    <button id="create-team-btn" class="btn btn-primary">Create</button>
                </div>
                <div class="team-option">
                    <h3>Join an Existing Team</h3>
                    <p>Enter the Team ID shared by the leader.</p>
                    <div class="join-team-action">
                        <input id="join-team-id-input" class="form-control" placeholder="Enter Team ID">
                        <button id="join-team-btn" class="btn btn-secondary">Join</button>
                    </div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(modal);
    const closeModal = () => { modal.remove(); };
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('#create-team-btn').addEventListener('click', () => { 
        const teamName = modal.querySelector('#team-name-input').value;
        createTeam(event, teamName);
        closeModal(); 
    });
    modal.querySelector('#join-team-btn').addEventListener('click', () => {
        const teamId = modal.querySelector('#join-team-id-input').value.toUpperCase();
        if (teamId) { 
            joinTeam(event, teamId);
            closeModal(); 
        } else { 
            showToast('Please enter a Team ID'); 
        }
    });
}
async function createTeam(event, teamName) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    try {
        const response = await fetch(`${PHP_API_BASE_URL}/create_team.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                eventId: event.id, 
                leaderId: currentUser.id,
                teamName: teamName
            })
        });
        if (!response.ok) {
            throw new Error(`Server error: ${response.statusText}`);
        }
        const result = await response.json();
        if(result.success) {
            addToCart(event.id, [], result.teamId, 'leader');
            refreshEventsDisplay();
            showToast(`Team created! ID: ${result.teamId}. Share this with your team!`);
        } else {
            showToast(result.message || "Could not create team.");
        }
    } catch (error) {
        console.error("Create Team Error:", error);
        showToast("Failed to create team. Please contact support.");
    }
}

async function joinTeam(event, teamId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    try {
        const validationResponse = await fetch(`${PHP_API_BASE_URL}/check_team.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId: event.id, teamId: teamId })
        });
        const validationResult = await validationResponse.json();

        if (!validationResult.success) {
            showToast(validationResult.message);
            return;
        }

        const joinResponse = await fetch(`${PHP_API_BASE_URL}/join_team.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, teamId: teamId })
        });
        const joinResult = await joinResponse.json();
        
        if (joinResult.success) {
            addToCart(event.id, [], teamId, 'approved'); 
            refreshEventsDisplay();
            showToast('Successfully joined team!');
        } else {
            showToast(joinResult.message || 'Could not send join request.');
        }
    } catch (error) {
        console.error("Join Team Error:", error);
        showToast("Failed to join team. Please try again.");
    }
}


function filterEvents(category) {
    const filteredEvents = getEventsByCategory(category);
    renderEvents(filteredEvents);
}

function filterEventsBySearch(query) {
    const searchedEvents = searchEvents(query);
    renderEvents(searchedEvents);
}

function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    const cart = getCart();

    cartItemsContainer.innerHTML = cart.length === 0 ? '<p>Your cart is empty.</p>' : '';

    if (cart.length > 0) {
        for (const item of cart) {
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            
            let priceDisplay;
            if (item.type === 'event' && item.teamId && item.teamStatus !== 'leader') {
                priceDisplay = 'Paid by Leader';
            } else {
                priceDisplay = parseFloat(item.price) === 0 ? 'FREE' : `₹${parseFloat(item.price).toFixed(2)}`;
            }
            
            let teamInfoHTML = '';
            if (item.teamId && item.teamStatus === 'leader') {
                teamInfoHTML = `
                    <p>Team ID: ${item.teamId} <span class="team-status-badge team-status-${item.teamStatus}">${item.teamStatus}</span></p>
                    <ul class="team-member-list" id="team-members-${item.teamId}"><li>Loading members...</li></ul>
                `;
            } else if (item.teamId) {
                teamInfoHTML = `<p>Team ID: ${item.teamId} <span class="team-status-badge team-status-approved">Member</span></p>`;
            }

            itemElement.innerHTML = `
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    ${teamInfoHTML}
                </div>
                <div class="cart-item-actions">
                    <span class="cart-item-price">${priceDisplay}</span>
                    <button class="cart-item-remove" data-item-id="${item.id}">&times;</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);

            if (item.teamId && item.teamStatus === 'leader') {
                fetchAndRenderTeamMembers(item.teamId);
            }
        }
    }

    cartTotalContainer.innerHTML = `Total: ₹${calculateTotal(cart).toFixed(2)}`;

    document.querySelectorAll('.cart-item-remove').forEach(button => {
        button.addEventListener('click', function() {
            removeFromCart(this.dataset.itemId);
            renderCartItems();
        });
    });
}

async function fetchAndRenderTeamMembers(teamId) {
    try {
        const response = await fetch(`${PHP_API_BASE_URL}/get_team_details.php?teamCode=${teamId}`);
        const members = await response.json();
        const memberListContainer = document.getElementById(`team-members-${teamId}`);
        if (memberListContainer) {
            if (members.length > 0) {
                memberListContainer.innerHTML = members.map(m => `<li>${m.name} (${m.status})</li>`).join('');
            } else {
                memberListContainer.innerHTML = '<li>Waiting for members to join...</li>';
            }
        }
    } catch (error) {
        console.error("Failed to fetch team members:", error);
        const memberListContainer = document.getElementById(`team-members-${teamId}`);
        if(memberListContainer) memberListContainer.innerHTML = '<li>Could not load team members.</li>';
    }
}


function showOTPVerification(email, password) {
    const modal = document.createElement('div');
    modal.className = 'otp-modal active';
    modal.innerHTML = `
        <div class="otp-modal-content">
            <div class="otp-modal-close">&times;</div>
            <h2>Verify Your Email</h2>
            <p>We've sent a 6-digit code to ${email}</p>
            <div class="otp-container">
                <input type="text" class="otp-input" maxlength="1"><input type="text" class="otp-input" maxlength="1"><input type="text" class="otp-input" maxlength="1"><input type="text" class="otp-input" maxlength="1"><input type="text" class="otp-input" maxlength="1"><input type="text" class="otp-input" maxlength="1">
            </div>
            <div class="otp-timer" id="otp-timer">02:00</div>
            <p>Didn't receive code? <span class="otp-resend" id="resend-otp">Resend</span></p>
            <div class="form-group mt-20">
                <button id="verify-otp" class="btn btn-primary">Verify</button>
            </div>
        </div>`;
    
    document.body.appendChild(modal);

    const otpInputs = modal.querySelectorAll('.otp-input');
    const timerElement = modal.querySelector('#otp-timer');
    let timeLeft = 120;

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', () => {
            if (input.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && input.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    modal.querySelector('.otp-modal-close').addEventListener('click', () => {
        clearInterval(modal.timer);
        modal.remove();
    });

    modal.timer = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(modal.timer);
            timerElement.textContent = '00:00';
            timerElement.style.color = '#e74c3c';
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);

     modal.querySelector('#resend-otp').addEventListener('click', async () => {
        if (timeLeft <= 0) {
            await sendOTP(email);
            showToast("A new OTP has been sent.");
            timeLeft = 120;
            timerElement.style.color = 'var(--primary-blue)';
            modal.timer = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) {
                    clearInterval(modal.timer);
                    timerElement.textContent = '00:00';
                    timerElement.style.color = '#e74c3c';
                } else {
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                }
            }, 1000);
        } else {
            showToast(`Please wait ${timeLeft} seconds before resending.`);
        }
    });
    
    modal.querySelector('#verify-otp').addEventListener('click', async () => {
        const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
        const isCorrect = await verifyOTP(email, enteredOtp);

        if (isCorrect) {
            clearInterval(modal.timer);
            showToast('OTP Verified! Creating account...');

            try {
                const response = await fetch(`${PHP_API_BASE_URL}/signup.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                if (response.status === 409) {
                    showToast("This email address is already registered.");
                    modal.remove();
                    document.querySelector('.auth-tab[data-tab="login"]').click();
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Server responded with status: ${response.status}`);
                }

                const result = await response.json();
                
                if (result.success && result.user) {
                    showToast('Account created! Logging you in...');
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    modal.remove();
                    // Instead of just showing the page, we re-trigger the main loader
                    document.dispatchEvent(new Event('DOMContentLoaded'));
                } else {
                    showToast(result.message || 'Could not create account.');
                    modal.remove();
                }
            } catch (error) {
                console.error('Signup Error:', error);
                showToast('Error creating account. Check server logs.');
            }
        } else {
            showToast('Invalid OTP.');
        }
    });
}
function handleUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId');
    if (eventId) sessionStorage.setItem('preselectedEventId', eventId);
}
async function processPreselectedEvent() {
    const eventId = sessionStorage.getItem('preselectedEventId');
    if (!eventId) return;
    await fetchAndSetEvents();
    const event = getEventById(eventId);
    if (!event) { showToast(`Event ID ${eventId} not found.`); sessionStorage.removeItem('preselectedEventId'); return; }
    if (getCart().some(item => item.eventId == event.id)) { showToast(`${event.title} is already in cart.`); sessionStorage.removeItem('preselectedEventId'); return; }
    if (event.type === 'team') {
        showTeamRegistrationModal(event);
    } else {
        addToCart(eventId);
    }
    sessionStorage.removeItem('preselectedEventId');
}