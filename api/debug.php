<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? '';

if ($action === 'users') {
    $result = supabaseRequest('GET', 'users?select=*');
    if ($result['code'] !== 200) {
        echo json_encode(['error' => 'Failed to fetch users', 'code' => $result['code'], 'data' => $result['data']]);
        exit;
    }
    $safe = array_map(function($u) {
        return [
            'username' => $u['username'],
            'password_hash_prefix' => substr($u['password_hash'] ?? '', 0, 15) . '...',
            'password_hash_length' => strlen($u['password_hash'] ?? ''),
            'created_at' => $u['created_at'] ?? null,
        ];
    }, $result['data']);
    echo json_encode(['count' => count($result['data']), 'users' => $safe]);
    exit;
}

if ($action === 'verify') {
    $username = $_GET['username'] ?? 'admin';
    $password = $_GET['password'] ?? 'pass$123';
    $result = supabaseRequest('GET', "users?username=eq.$username&select=*");
    if (empty($result['data'])) {
        echo json_encode(['found' => false, 'error' => 'User not found']);
        exit;
    }
    $hash = $result['data'][0]['password_hash'];
    $verify = password_verify($password, $hash);
    echo json_encode([
        'found' => true,
        'username' => $result['data'][0]['username'],
        'hash_prefix' => substr($hash, 0, 20) . '...',
        'password_verify_result' => $verify,
    ]);
    exit;
}

echo json_encode([
    'usage' => [
        '/api/debug?action=users' => 'List all users (safe, no full hash)',
        '/api/debug?action=verify&username=admin&password=pass$123' => 'Test password verification',
    ]
]);
