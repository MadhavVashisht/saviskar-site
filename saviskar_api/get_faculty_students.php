<?php
// api/get_faculty_students.php
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
    die(json_encode(["success" => false, "message" => "Connection failed: " . $conn->connect_error]));
}

$facultyId = isset($_GET['facultyId']) ? (int)$_GET['facultyId'] : 0;

if ($facultyId === 0) {
    http_response_code(400);
    die(json_encode(["success" => false, "message" => "Faculty ID is required."]));
}

// This query joins users with their saved carts to find students linked to the faculty member
$stmt = $conn->prepare("
    SELECT u.id, u.name, u.email, u.college, sc.cart_data 
    FROM users u 
    JOIN saved_carts sc ON u.id = sc.user_id 
    WHERE u.is_faculty = 0 AND u.faculty_incharge_id = ?
");
$stmt->bind_param("i", $facultyId);
$stmt->execute();
$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $row['cart_data'] = json_decode($row['cart_data']);
    $students[] = $row;
}

echo json_encode($students);

$stmt->close();
$conn->close();
?>