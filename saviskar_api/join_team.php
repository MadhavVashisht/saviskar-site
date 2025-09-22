<?php
// api/join_team.php
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

if (empty($data->teamId) || empty($data->userId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Team ID and User ID are required."]);
    exit();
}

// Find the internal team id (primary key) and event_id from the team_code
$stmt = $conn->prepare("SELECT id, event_id FROM teams WHERE team_code = ?");
$stmt->bind_param("s", $data->teamId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $team = $result->fetch_assoc();
    $team_pk_id = $team['id'];
    $event_id = $team['event_id'];

    // Insert the member with 'approved' status directly.
    // ON DUPLICATE KEY UPDATE handles cases where a user might try to rejoin.
    $stmt_insert = $conn->prepare("INSERT INTO team_members (team_id, user_id, status) VALUES (?, ?, 'approved') ON DUPLICATE KEY UPDATE status = 'approved'");
    $stmt_insert->bind_param("ii", $team_pk_id, $data->userId);

    if($stmt_insert->execute()){
        http_response_code(200);
        // Return the event ID so the frontend can add the correct event to the cart
        echo json_encode(["success" => true, "message" => "Joined team successfully.", "eventId" => $event_id]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to join team. You may already be a member."]);
    }
    $stmt_insert->close();
} else {
     http_response_code(404);
     echo json_encode(["success" => false, "message" => "Team not found."]);
}

$stmt->close();
$conn->close();
?>