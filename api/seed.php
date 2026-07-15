<?php
require_once __DIR__ . '/config.php';

$password = 'pass$123';
$hash = password_hash($password, PASSWORD_BCRYPT);

$result = supabaseRequest('POST', 'users', [
    'username' => 'admin',
    'password_hash' => $hash
]);

if ($result['code'] === 201) {
    echo json_encode(['message' => 'Admin user created successfully']);
} elseif ($result['code'] === 409) {
    echo json_encode(['message' => 'Admin user already exists']);
} else {
    http_response_code($result['code']);
    echo json_encode(['message' => 'Failed to create user', 'detail' => $result['data']]);
}
