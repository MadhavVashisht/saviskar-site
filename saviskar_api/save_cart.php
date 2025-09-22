<?php
// api/save_cart.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Origin: https://registrations.saviskar.co.in");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// This block handles the browser's preflight security check
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Database Connection ---
$db_host = 'srv1954.hstgr.io'; 
$db_user = 'u936036310_Saviskar'; 
$db_pass = 'ITSaviskar@321'; // Use the new password you set on Hostinger
$db_name = 'u936036310_saviskar_db';
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->userId) || !isset($data->cart)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID and cart data are required."]);
    exit();
}

$userId = $data->userId;
$cartData = json_encode($data->cart);

// Use INSERT...ON DUPLICATE KEY UPDATE to either create or update the user's saved cart
$stmt = $conn->prepare("INSERT INTO saved_carts (user_id, cart_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE cart_data = VALUES(cart_data)");
$stmt->bind_param("is", $userId, $cartData);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Cart saved successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to save cart."]);
}

$stmt->close();
$conn->close();
?>