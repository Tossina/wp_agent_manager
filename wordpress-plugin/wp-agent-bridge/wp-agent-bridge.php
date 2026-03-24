<?php
/**
 * Plugin Name: WP_MNGR Bridge
 * Plugin URI:  https://wpagent.dev
 * Description: Pont API sécurisé pour WP_MNGR — gérez votre site avec l'intelligence artificielle.
 * Version:     1.2.0
 * Author:      WP_MNGR
 * Author URI:  https://wpagent.dev
 * License:     GPL v2 or later
 * Text Domain: wp-mngr-bridge
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

defined('ABSPATH') || exit;

define('WP_AGENT_VERSION', '1.2.0');
define('WP_AGENT_PLUGIN_DIR', str_replace('\\', '/', trailingslashit(dirname(__FILE__))));
define('WP_AGENT_PLUGIN_URL', plugin_dir_url(__FILE__));

// Chargement des classes
require_once WP_AGENT_PLUGIN_DIR . 'includes/class-wp-agent-api.php';
require_once WP_AGENT_PLUGIN_DIR . 'includes/class-wp-agent-auth.php';
require_once WP_AGENT_PLUGIN_DIR . 'includes/class-wp-agent-actions.php';
require_once WP_AGENT_PLUGIN_DIR . 'includes/class-wp-agent-admin.php';

// Initialisation
add_action('plugins_loaded', function () {
    WP_Agent_API::get_instance();
    WP_Agent_Admin::get_instance();
});

// Activation
register_activation_hook(__FILE__, function () {
    if (!get_option('wp_agent_api_key')) {
        update_option('wp_agent_api_key', wp_generate_uuid4());
    }
});

// Désactivation
register_deactivation_hook(__FILE__, function () {
    // Nettoyage optionnel
});
