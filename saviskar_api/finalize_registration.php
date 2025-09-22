<?php
// api/finalize_registration.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: https://registrations.saviskar.co.in");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

// --- Get Input Data ---
$data = json_decode(file_get_contents("php://input"));

if (empty($data->user) || !isset($data->cart)) {
    http_response_code(400);
    die(json_encode(["success" => false, "message" => "User and cart data are required."]));
}

$user = $data->user;
$cart = $data->cart;
$userId = $user->id;

// Server-side validation and calculation
$totalAmount = 0;
foreach ($cart as $item) {
    // For security, you could re-fetch item prices from the DB here
    $totalAmount += (float)$item->price;
}

// Use a transaction for data integrity
$conn->begin_transaction();

try {
    // 1. Create a main registration record
    // For faculty with 0 total, we still mark it 'paid' as no payment is needed.
    $paymentStatus = ($totalAmount == 0 && $user->is_faculty) ? 'paid' : 'pending';
    $stmt_reg = $conn->prepare("INSERT INTO registrations (user_id, total_amount, payment_status) VALUES (?, ?, ?)");
    $stmt_reg->bind_param("ids", $userId, $totalAmount, $paymentStatus);
    if (!$stmt_reg->execute()) {
        throw new Exception("Failed to create registration record.");
    }
    $registrationId = $conn->insert_id;
    $stmt_reg->close();

    // 2. Insert each cart item into the registration_items table
    $stmt_item = $conn->prepare("INSERT INTO registration_items (registration_id, item_type, item_id, item_name, price, team_id, team_status) VALUES (?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($cart as $item) {
        $teamId = isset($item->teamId) ? $item->teamId : null;
        $teamStatus = isset($item->teamStatus) ? $item->teamStatus : null;
        
        $stmt_item->bind_param(
            "isssdss",
            $registrationId,
            $item->type,
            $item->id,
            $item->name,
            $item->price,
            $teamId,
            $teamStatus
        );
        if (!$stmt_item->execute()) {
            throw new Exception("Failed to insert registration item: " . $item->name);
        }
    }
    $stmt_item->close();

    // If all went well, commit the transaction
    $conn->commit();
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "Registration finalized successfully."]);

} catch (Exception $e) {
    // If anything failed, roll back all database changes
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "A database error occurred: " . $e->getMessage()]);
}

$conn->close();
?>