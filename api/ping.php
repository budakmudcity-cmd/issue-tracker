<?php
require_once __DIR__ . '/config.php';

echo json_encode([
    'status' => 'ok',
    'php_version' => phpversion(),
    'supabase_url' => substr(SUPABASE_URL, 0, 20) . '...',
    'supabase_key_set' => defined('SUPABASE_KEY') && SUPABASE_KEY !== '',
    'jwt_secret_set'   => defined('JWT_SECRET') && JWT_SECRET !== ''
]);
