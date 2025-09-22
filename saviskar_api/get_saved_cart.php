<?php
// api/get_saved_cart.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Origin: https://registrations.saviskar.co.in");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'srv1954.hstgr.io'; 
$db_user = 'u936036310_Saviskar'; 
$db_pass = 'ITSaviskar@321'; // Use the new password you set on Hostinger
$db_name = 'u936036310_saviskar_db';
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode([]));
}

$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 0;
if ($userId === 0) {
    die(json_encode([]));
}

$savedCart = null;
$cart_stmt = $conn->prepare("SELECT cart_data FROM saved_carts WHERE user_id = ?");
$cart_stmt->bind_param("i", $userId);
$cart_stmt->execute();
$cart_result = $cart_stmt->get_result();

if ($cart_result->num_rows > 0) {
    $cart_row = $cart_result->fetch_assoc();
    $savedCart = json_decode($cart_row['cart_data']);
    
    // Delete the cart from the database after retrieving it
    $del_stmt = $conn->prepare("DELETE FROM saved_carts WHERE user_id = ?");
    $del_stmt->bind_param("i", $userId);
    $del_stmt->execute();
    $del_stmt->close();
}
$cart_stmt->close();
$conn->close();

echo json_encode($savedCart ?: []);
?>