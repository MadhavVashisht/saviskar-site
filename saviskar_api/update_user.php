<?php
// api/update_user.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    die(json_encode(["success" => false, "message" => "User ID is missing."]));
}

$userId = $data->id;
$name = $data->name;
$phone = $data->phone;
$college = $data->college;
$state = $data->state;
$city = $data->city;
$is_faculty = $data->is_faculty ? 1 : 0;
$year = $data->year;
$course = $data->course;
$faculty_incharge_id_from_form = $data->faculty_incharge_id;
$validated_faculty_id = null;

if (!empty($faculty_incharge_id_from_form)) {
    if (preg_match('/^F(\d{3,})$/i', $faculty_incharge_id_from_form, $matches)) {
        $numeric_faculty_id = (int)$matches[1];
        
        $stmt_check = $conn->prepare("SELECT id FROM users WHERE id = ? AND is_faculty = 1");
        $stmt_check->bind_param("i", $numeric_faculty_id);
        $stmt_check->execute();
        $result = $stmt_check->get_result();

        if ($result->num_rows === 1) {
            $validated_faculty_id = $numeric_faculty_id;
        } else {
            http_response_code(400);
            die(json_encode(["success" => false, "message" => "Invalid Faculty Incharge ID provided."]));
        }
        $stmt_check->close();
    } else {
        http_response_code(400);
        die(json_encode(["success" => false, "message" => "Faculty ID has an incorrect format. Expected: F001" ]));
    }
}

$stmt = $conn->prepare("UPDATE users SET name = ?, phone = ?, college = ?, state = ?, city = ?, is_faculty = ?, year = ?, course = ?, faculty_incharge_id = ? WHERE id = ?");
$stmt->bind_param("sssssissii", $name, $phone, $college, $state, $city, $is_faculty, $year, $course, $validated_faculty_id, $userId);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(["success" => true, "message" => "User details updated successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error updating user details: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>