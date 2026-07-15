<?php
require_once __DIR__ . '/config.php';

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';

    if (!$username || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password required']);
        exit;
    }

    $result = supabaseRequest('GET', "users?username=eq.$username&select=*");

    if ($result['code'] !== 200) {
        http_response_code(500);
        echo json_encode(['error' => 'Supabase query failed', 'supabase_code' => $result['code'], 'supabase_data' => $result['data']]);
        exit;
    }

    if (empty($result['data'])) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found in Supabase']);
        exit;
    }

    $storedHash = $result['data'][0]['password_hash'];
    if (!password_verify($password, $storedHash)) {
        http_response_code(401);
        echo json_encode(['error' => 'Password does not match stored hash']);
        exit;
    }

    $token = generateToken($username);

    echo json_encode([
        'token' => $token,
        'user' => ['username' => $username]
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
