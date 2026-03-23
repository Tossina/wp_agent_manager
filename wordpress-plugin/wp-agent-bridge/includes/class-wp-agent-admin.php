<?php
/**
 * Interface d'administration WordPress pour WP Agent Bridge
 */

defined('ABSPATH') || exit;

class WP_Agent_Admin {

    private static $instance = null;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_post_wp_agent_regenerate_key', [$this, 'regenerate_key']);
    }

    public function add_menu() {
        add_options_page(
            'WP Agent Bridge',
            'WP Agent',
            'manage_options',
            'wp-agent-bridge',
            [$this, 'render_page']
        );
    }

    public function render_page() {
        if (!current_user_can('manage_options')) wp_die('Accès refusé');

        $api_key  = get_option('wp_agent_api_key', '');
        $site_url = get_site_url();
        $logs     = array_slice(get_option('wp_agent_logs', []), 0, 20);
        ?>
        <div class="wrap">
            <h1>🤖 WP Agent Bridge</h1>
            <p>Connectez votre site WordPress à <a href="<?php echo esc_url($site_url); ?>" target="_blank">WP Agent</a> pour le gérer avec l'intelligence artificielle.</p>

            <div class="card" style="max-width:600px;padding:20px;margin-top:20px;">
                <h2>🔑 Votre clé API</h2>
                <p>Copiez cette clé dans WP Agent lors de la connexion de votre site :</p>
                <div style="display:flex;gap:10px;align-items:center;">
                    <input
                        type="text"
                        id="wp-agent-api-key"
                        value="<?php echo esc_attr($api_key); ?>"
                        class="regular-text"
                        readonly
                        style="font-family:monospace;font-size:13px;"
                    />
                    <button
                        type="button"
                        class="button"
                        onclick="navigator.clipboard.writeText(document.getElementById('wp-agent-api-key').value).then(()=>alert('Clé copiée !'))"
                    >
                        Copier
                    </button>
                </div>
                <p style="margin-top:15px;">
                    <strong>URL de votre site :</strong>
                    <code><?php echo esc_html($site_url); ?></code>
                </p>

                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="margin-top:15px;">
                    <input type="hidden" name="action" value="wp_agent_regenerate_key">
                    <?php wp_nonce_field('wp_agent_regenerate_key'); ?>
                    <button type="submit" class="button button-secondary" onclick="return confirm('Êtes-vous sûr ? L\'ancienne clé sera invalidée.')">
                        🔄 Régénérer la clé API
                    </button>
                </form>
            </div>

            <div class="card" style="max-width:600px;padding:20px;margin-top:20px;">
                <h2>📊 Dernières actions</h2>
                <?php if (empty($logs)): ?>
                    <p>Aucune action enregistrée.</p>
                <?php else: ?>
                    <table class="widefat striped">
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Date</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($logs as $log): ?>
                                <tr>
                                    <td><code><?php echo esc_html($log['action']); ?></code></td>
                                    <td><?php echo esc_html($log['timestamp']); ?></td>
                                    <td><?php echo esc_html($log['ip']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                <?php endif; ?>
            </div>

            <div class="card" style="max-width:600px;padding:20px;margin-top:20px;">
                <h2>📋 Informations de connexion</h2>
                <table class="form-table">
                    <tr>
                        <th>Endpoint API</th>
                        <td><code><?php echo esc_html($site_url . '/wp-json/wp-agent/v1/execute'); ?></code></td>
                    </tr>
                    <tr>
                        <th>Version plugin</th>
                        <td><?php echo esc_html(WP_AGENT_VERSION); ?></td>
                    </tr>
                    <tr>
                        <th>PHP</th>
                        <td><?php echo PHP_VERSION; ?></td>
                    </tr>
                    <tr>
                        <th>WordPress</th>
                        <td><?php echo get_bloginfo('version'); ?></td>
                    </tr>
                </table>
            </div>
        </div>
        <?php
    }

    public function regenerate_key() {
        if (!current_user_can('manage_options')) wp_die('Accès refusé');
        check_admin_referer('wp_agent_regenerate_key');

        update_option('wp_agent_api_key', wp_generate_uuid4());
        wp_redirect(add_query_arg(['page' => 'wp-agent-bridge', 'key_regenerated' => '1'], admin_url('options-general.php')));
        exit;
    }
}
