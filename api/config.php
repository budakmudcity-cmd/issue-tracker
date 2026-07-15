<?php
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$envError = null;
$supabaseUrl = getenv('SUPABASE_URL');
$supabaseKey = getenv('SUPABASE_KEY');
$jwtSecret   = getenv('JWT_SECRET');

if (!$supabaseUrl) $envError = 'Missing SUPABASE_URL env var';
elseif (!$supabaseKey) $envError = 'Missing SUPABASE_KEY env var';
elseif (!$jwtSecret) $envError = 'Missing JWT_SECRET env var';

if ($envError) {
    http_response_code(500);
    echo json_encode(['error' => $envError]);
    exit;
}

function supabaseRequest($method, $endpoint, $data = null) {
    $url = rtrim(SUPABASE_URL, '/') . '/rest/v1/' . $endpoint;
    $headers = [
        'apikey: ' . SUPABASE_KEY,
        'Authorization: Bearer ' . SUPABASE_KEY,
        'Content-Type: application/json',
        'Prefer: return=representation'
    ];
    $ch = curl_init($url);
    if ($ch === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to initialize cURL']);
        exit;
    }
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'data' => json_decode($response, true)];
}

function generateToken($username) {
    $header = rtrim(strtr(base64_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT'])), '+/', '-_'), '=');
    $payload = rtrim(strtr(base64_encode(json_encode([
        'username' => $username,
        'exp' => time() + 86400
    ])), '+/', '-_'), '=');
    $signature = rtrim(strtr(base64_encode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    ), '+/', '-_'), '=');
    return "$header.$payload.$signature";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;
    [$header, $payload, $signature] = $parts;
    $expected = rtrim(strtr(base64_encode(
        hash_hmac('sha256', "$header.$payload", JWT_SECRET, true)
    ), '+/', '-_'), '=');
    if (!hash_equals($expected, $signature)) return false;
    $data = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
    if (!$data || $data['exp'] < time()) return false;
    return $data;
}

function requireAuth() {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $auth, $m)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $user = verifyToken($m[1]);
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        exit;
    }
    return $user;
}
