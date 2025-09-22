<?php
// api/signup.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Origin: https://registrations.saviskar.co.in");
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
if (!isset($data->email) || !isset($data->password)) {
    http_response_code(400);
    die(json_encode(["success" => false, "message" => "Email and password are required."]));
}

$email = $data->email;
$password = $data->password;

// --- Check if User Already Exists ---
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    http_response_code(409); // 409 Conflict
    echo json_encode(["success" => false, "message" => "An account with this email already exists."]);
    $stmt->close();
    $conn->close();
    exit();
}
$stmt->close();

// --- Create New User ---
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (email, password) VALUES (?, ?)");
$stmt->bind_param("ss", $email, $hashed_password);

if ($stmt->execute()) {
    $new_user_id = $conn->insert_id;
    
    // Fetch the new user's full data to send back for auto-login
    $stmt_select = $conn->prepare("SELECT id, email, name, phone, college, state, city, is_faculty, year, course FROM users WHERE id = ?");
    $stmt_select->bind_param("i", $new_user_id);
    $stmt_select->execute();
    $result = $stmt_select->get_result();
    $user = $result->fetch_assoc();
    $stmt_select->close();

    http_response_code(201);
    echo json_encode(["success" => true, "message" => "Account created successfully.", "user" => $user]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error creating account on the server."]);
}

$stmt->close();
$conn->close();
?>