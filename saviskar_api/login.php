<?php
// api/login.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Origin: https://registrations.saviskar.co.in");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db_host = 'srv1954.hstgr.io'; 
$db_user = 'u936036310_Saviskar'; 
$db_pass = 'ITSaviskar@321'; // Use the new password you set on Hostinger
$db_name = 'u936036310_saviskar_db';
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
// ... (db connection error handling) ...

$data = json_decode(file_get_contents("php://input"));
// ... (input validation) ...

$email = $data->email;
$password_from_user = $data->password;

// FIXED: Added `faculty_incharge_id` to the SELECT statement
$stmt = $conn->prepare("SELECT id, password, name, email, phone, college, state, city, is_faculty, year, course, faculty_incharge_id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password_from_user, $user['password'])) {
        unset($user['password']); 
        $userId = $user['id'];
        $savedCart = null;

        $cart_stmt = $conn->prepare("SELECT cart_data FROM saved_carts WHERE user_id = ?");
        $cart_stmt->bind_param("i", $userId);
        $cart_stmt->execute();
        $cart_result = $cart_stmt->get_result();
        
        if ($cart_result->num_rows > 0) {
            $cart_row = $cart_result->fetch_assoc();
            $savedCart = json_decode($cart_row['cart_data']);
            
            $del_stmt = $conn->prepare("DELETE FROM saved_carts WHERE user_id = ?");
            $del_stmt->bind_param("i", $userId);
            $del_stmt->execute();
            $del_stmt->close();
        }
        $cart_stmt->close();
        
        http_response_code(200);
        echo json_encode(["success" => true, "user" => $user, "savedCart" => $savedCart]);

    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    }
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
}

$stmt->close();
$conn->close();
?>