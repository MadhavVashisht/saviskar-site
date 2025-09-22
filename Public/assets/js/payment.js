// Payment processing functionality

// Initialize Razorpay payment
function initRazorpayPayment(amount, orderId, callback) {
    // This is a mock implementation since we can't integrate
    // the actual Razorpay API without backend support
    
    console.log(`Initializing payment of ₹${amount} for order ${orderId}`);
    
    // Simulate payment process
    setTimeout(() => {
        // Simulate successful payment 80% of the time
        const success = Math.random() > 0.2;
        callback(success);
    }, 2000);
}

// Generate order ID
function generateOrderId() {
    return 'ORD_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// Process payment
function processPayment(amount, successCallback, errorCallback) {
    const orderId = generateOrderId();
    
    initRazorpayPayment(amount, orderId, (success) => {
        if (success) {
            successCallback(orderId);
        } else {
            errorCallback('Payment failed. Please try again.');
        }
    });
}

// Generate payment receipt
function generateReceipt(orderId, amount, items) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const date = new Date().toLocaleDateString();
    
    return {
        orderId,
        date,
        amount,
        items,
        user: {
            name: currentUser.name,
            email: currentUser.email,
            id: currentUser.id
        },
        facultyId: currentUser.isFaculty ? 'FAC_' + Math.floor(Math.random() * 10000) : null
    };
}

// Save payment record
function savePaymentRecord(receipt) {
    let payments = JSON.parse(localStorage.getItem('payments') || '[]');
    payments.push(receipt);
    localStorage.setItem('payments', JSON.stringify(payments));
    return receipt;
}