<?php
// api/create_team.php

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

// Helper function to create a 3-letter acronym from an event title
function createEventAcronym($title) {
    $title = preg_replace('/[^a-zA-Z\s]/', '', $title); // Remove special chars
    $words = explode(' ', $title);
    $acronym = '';
    foreach ($words as $w) {
        if (!empty($w)) {
            $acronym .= mb_substr($w, 0, 1);
        }
    }
    return strtoupper(substr($acronym, 0, 3));
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->eventId) || empty($data->leaderId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
    exit();
}

$eventId = $data->eventId;
$leaderId = $data->leaderId;
$teamName = isset($data->teamName) && !empty($data->teamName) ? trim($data->teamName) : null;

// Start a transaction to ensure all database operations succeed or fail together
$conn->begin_transaction();

try {
    // 1. Get the event title to create the team code prefix
    $stmt = $conn->prepare("SELECT title FROM events WHERE id = ?");
    $stmt->bind_param("i", $eventId);
    $stmt->execute();
    $eventResult = $stmt->get_result();
    if ($eventResult->num_rows === 0) {
        throw new Exception("Event not found.");
    }
    $eventRow = $eventResult->fetch_assoc();
    $eventPrefix = createEventAcronym($eventRow['title']);
    $stmt->close();

    // 2. Get the last team number for this specific event prefix to auto-increment
    $newNumericId = 1;
    $likePrefix = $eventPrefix . '%';
    $stmt = $conn->prepare("SELECT MAX(CAST(SUBSTRING(team_code, 4) AS UNSIGNED)) as max_id FROM teams WHERE team_code LIKE ?");
    $stmt->bind_param("s", $likePrefix);
    $stmt->execute();
    $teamResult = $stmt->get_result();
    if ($teamResult->num_rows > 0) {
        $teamRow = $teamResult->fetch_assoc();
        if ($teamRow['max_id'] !== null) {
            $newNumericId = (int)$teamRow['max_id'] + 1;
        }
    }
    $stmt->close();

    // 3. Format the new team ID (e.g., BOB001)
    $newTeamId = $eventPrefix . sprintf('%03d', $newNumericId);

    // 4. Insert the new team into the `teams` table
    $stmt = $conn->prepare("INSERT INTO teams (team_code, team_name, event_id, leader_id) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssii", $newTeamId, $teamName, $eventId, $leaderId);
    if (!$stmt->execute()) {
        throw new Exception("Could not insert new team. It might already exist.");
    }
    $teamInsertId = $conn->insert_id;
    $stmt->close();

    // 5. Automatically add the leader to the `team_members` table with 'approved' status
    $stmt = $conn->prepare("INSERT INTO team_members (team_id, user_id, status) VALUES (?, ?, 'approved')");
    $stmt->bind_param("ii", $teamInsertId, $leaderId);
    if (!$stmt->execute()) {
        throw new Exception("Failed to add leader to the team members list.");
    }
    $stmt->close();

    // If all steps succeeded, commit the changes to the database
    $conn->commit();
    
    http_response_code(201);
    echo json_encode(["success" => true, "teamId" => $newTeamId]);

} catch (Exception $e) {
    // If any step failed, roll back all changes
    $conn->rollback();
    
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$conn->close();
?>