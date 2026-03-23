<?php
/**
 * Authentification HMAC-SHA256 pour WP Agent Bridge
 */

defined('ABSPATH') || exit;

class WP_Agent_Auth {

    /**
     * Valide la requête entrante via HMAC-SHA256
     */
    public static function validate_request(WP_REST_Request $request) {
        $api_key    = $request->get_header('X-WP-Agent-Key');
        $signature  = $request->get_header('X-WP-Agent-Signature');
        $timestamp  = $request->get_header('X-WP-Agent-Timestamp');

        if (!$api_key || !$signature || !$timestamp) {
            return false;
        }

        // Vérifier que la clé API correspond
        $stored_key = get_option('wp_agent_api_key');
        if (!hash_equals($stored_key, $api_key)) {
            return false;
        }

        // Anti-replay : timestamp valide ±5 minutes
        $now = time() * 1000; // en millisecondes
        $ts  = (int) $timestamp;
        if (abs($now - $ts) > 5 * 60 * 1000) {
            return false;
        }

        // Vérifier la signature HMAC sur le body
        $body             = $request->get_body();
        $expected_signature = hash_hmac('sha256', $body, $api_key);

        return hash_equals($expected_signature, $signature);
    }

    /**
     * Permission callback pour les routes REST
     */
    public static function permission_callback(WP_REST_Request $request) {
        if (!self::validate_request($request)) {
            return new WP_Error(
                'wp_agent_unauthorized',
                __('Clé API invalide ou signature incorrecte.', 'wp-agent-bridge'),
                ['status' => 401]
            );
        }
        return true;
    }
}
