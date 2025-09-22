<?php
// api/get_team_details.php
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
// ... (db connection error handling) ...

$teamCode = isset($_GET['teamCode']) ? $_GET['teamCode'] : '';
if (empty($teamCode)) {
    die(json_encode([]));
}

// FIXED: Changed `tm.status = 'approved'` to `tm.status != 'declined'` to show both approved and pending members
$stmt = $conn->prepare("
    SELECT u.name, tm.status 
    FROM team_members tm
    JOIN users u ON tm.user_id = u.id
    JOIN teams t ON tm.team_id = t.id
    WHERE t.team_code = ? AND tm.status != 'declined'
");
$stmt->bind_param("s", $teamCode);
$stmt->execute();
$result = $stmt->get_result();

$members = [];
while ($row = $result->fetch_assoc()) {
    $members[] = $row;
}

echo json_encode($members);
$stmt->close();
$conn->close();
?>