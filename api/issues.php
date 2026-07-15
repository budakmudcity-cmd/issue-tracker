<?php
require_once __DIR__ . '/config.php';
$authUser = requireAuth();

$method = $_SERVER['REQUEST_METHOD'];
$issueId = $_GET['id'] ?? null;

switch ($method) {
    case 'GET':
        if ($issueId) {
            $result = supabaseRequest('GET', "issues?id=eq.$issueId&select=*");
        } else {
            $result = supabaseRequest('GET', 'issues?select=*&order=created_at.desc');
        }
        http_response_code($result['code']);
        echo json_encode($result['data'] ?? []);
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if (empty($input['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title is required']);
            break;
        }
        $input['created_by'] = $authUser['username'];
        $input['status'] = $input['status'] ?? 'open';
        $input['priority'] = $input['priority'] ?? 'medium';
        $result = supabaseRequest('POST', 'issues', $input);
        http_response_code($result['code']);
        echo json_encode($result['data']);
        break;

    case 'PUT':
        if (!$issueId) {
            http_response_code(400);
            echo json_encode(['error' => 'Issue ID required']);
            break;
        }
        $input = json_decode(file_get_contents('php://input'), true);
        $result = supabaseRequest('PATCH', "issues?id=eq.$issueId", $input);
        http_response_code($result['code']);
        echo json_encode($result['data']);
        break;

    case 'DELETE':
        if (!$issueId) {
            http_response_code(400);
            echo json_encode(['error' => 'Issue ID required']);
            break;
        }
        $result = supabaseRequest('DELETE', "issues?id=eq.$issueId");
        http_response_code($result['code']);
        echo json_encode(['message' => 'Deleted']);
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
}
