<?php
/**
 * Enregistrement des routes REST API
 */

defined('ABSPATH') || exit;

class WP_Agent_API {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('wp-agent/v1', '/execute', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_execute'],
            'permission_callback' => ['WP_Agent_Auth', 'permission_callback'],
        ]);

        register_rest_route('wp-agent/v1', '/status', [
            'methods'             => 'GET',
            'callback'            => [$this, 'handle_status'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Point d'entrée principal — dispatch vers les actions
     */
    public function handle_execute(WP_REST_Request $request) {
        $body   = json_decode($request->get_body(), true);
        $action = sanitize_key($body['action'] ?? '');
        $params = $body['params'] ?? [];

        if (!$action) {
            return new WP_REST_Response(['error' => 'Action manquante'], 400);
        }

        // Log de l'action
        $this->log_action($action, $params);

        $actions = new WP_Agent_Actions();
        $method  = str_replace('-', '_', $action);

        if (!method_exists($actions, $method)) {
            return new WP_REST_Response(['error' => "Action '$action' non supportée"], 400);
        }

        try {
            $result = $actions->$method($params);
            return new WP_REST_Response($result, 200);
        } catch (Exception $e) {
            return new WP_REST_Response(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Statut public du plugin (pour vérification)
     */
    public function handle_status() {
        return new WP_REST_Response([
            'status'  => 'ok',
            'plugin'  => 'wp-agent-bridge',
            'version' => WP_AGENT_VERSION,
        ], 200);
    }

    /**
     * Log simple des actions dans les options WP
     */
    private function log_action($action, $params) {
        $logs = get_option('wp_agent_logs', []);
        array_unshift($logs, [
            'action'    => $action,
            'timestamp' => current_time('mysql'),
            'ip'        => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        ]);
        // Garder les 100 derniers logs
        $logs = array_slice($logs, 0, 100);
        update_option('wp_agent_logs', $logs, false);
    }
}
