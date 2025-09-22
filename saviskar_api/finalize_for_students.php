<?php
// api/finalize_for_students.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Origin: https://registrations.saviskar.co.in");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$db_host = 'srv1954.hstgr.io'; 
$db_user = 'u936036310_Saviskar'; 
$db_pass = 'ITSaviskar@321'; // Use the new password you set on Hostinger
$db_name = 'u936036310_saviskar_db';
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);
// ... (error handling) ...

$data = json_decode(file_get_contents("php://input"));
$studentIds = $data->studentIds;

if (empty($studentIds)) {
    die(json_encode(["success" => false, "message" => "No student IDs provided."]));
}

$conn->begin_transaction();

try {
    foreach ($studentIds as $studentId) {
        // 1. Get the student's saved cart
        $stmt_get = $conn->prepare("SELECT cart_data FROM saved_carts WHERE user_id = ?");
        $stmt_get->bind_param("i", $studentId);
        $stmt_get->execute();
        $cart_result = $stmt_get->get_result();
        
        if ($cart_result->num_rows > 0) {
            $cart_row = $cart_result->fetch_assoc();
            $cart = json_decode($cart_row['cart_data'], true);
            $totalAmount = 0;
            foreach($cart as $item) {
                $totalAmount += (float)$item['price'];
            }

            // 2. Create a finalized registration for the student
            $stmt_reg = $conn->prepare("INSERT INTO registrations (user_id, total_amount, payment_status) VALUES (?, ?, 'paid')");
            $stmt_reg->bind_param("id", $studentId, $totalAmount);
            $stmt_reg->execute();
            $registrationId = $conn->insert_id;

            // 3. Move items from cart to registration_items
            foreach($cart as $item) {
                $stmt_item = $conn->prepare("INSERT INTO registration_items (registration_id, item_type, item_id, item_name, price, team_id, team_status) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt_item->bind_param("isssdss", $registrationId, $item['type'], $item['id'], $item['name'], $item['price'], $item['teamId'], $item['teamStatus']);
                $stmt_item->execute();
            }

            // 4. Delete the student's saved cart
            $stmt_del = $conn->prepare("DELETE FROM saved_carts WHERE user_id = ?");
            $stmt_del->bind_param("i", $studentId);
            $stmt_del->execute();
        }
    }
    
    $conn->commit();
    echo json_encode(["success" => true, "message" => "Registrations finalized successfully for selected students."]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "An error occurred: " . $e->getMessage()]);
}

$conn->close();
?>