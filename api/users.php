<?php
require_once __DIR__ . '/config.php';
requireAuth();

$result = supabaseRequest('GET', 'users?select=username');
http_response_code($result['code']);
echo json_encode($result['data'] ?? []);
