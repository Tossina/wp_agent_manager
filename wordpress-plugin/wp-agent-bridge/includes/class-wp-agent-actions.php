<?php
/**
 * Actions WordPress exécutables par WP Agent
 */

defined('ABSPATH') || exit;

class WP_Agent_Actions {

    // ─── Informations du site ──────────────────────────────

    public function wp_get_site_info(array $params): array {
        global $wp_version;
        return [
            'name'           => get_bloginfo('name'),
            'url'            => get_site_url(),
            'admin_email'    => get_bloginfo('admin_email'),
            'version'        => $wp_version,
            'php_version'    => PHP_VERSION,
            'active_theme'   => wp_get_theme()->get('Name'),
            'language'       => get_locale(),
            'active_plugins' => $this->_get_active_plugin_names(),
        ];
    }

    // ─── Plugins ───────────────────────────────────────────

    public function wp_list_plugins(array $params): array {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        if (!function_exists('get_plugin_updates')) {
            require_once ABSPATH . 'wp-admin/includes/update.php';
        }

        $status  = $params['status'] ?? 'all';
        $plugins = get_plugins();
        $active  = get_option('active_plugins', []);
        $updates = get_plugin_updates();

        $result = [];
        foreach ($plugins as $file => $data) {
            $is_active = in_array($file, $active);

            if ($status === 'active' && !$is_active) continue;
            if ($status === 'inactive' && $is_active) continue;

            $result[] = [
                'slug'        => dirname($file),
                'file'        => $file,
                'name'        => $data['Name'],
                'version'     => $data['Version'],
                'active'      => $is_active,
                'has_update'  => isset($updates[$file]),
                'new_version' => $updates[$file]->update->new_version ?? null,
                'author'      => $data['Author'],
                'description' => wp_strip_all_tags($data['Description']),
            ];
        }

        return ['plugins' => $result, 'total' => count($result)];
    }

    public function wp_install_plugin(array $params): array {
        $slug     = sanitize_text_field($params['slug'] ?? '');
        $activate = (bool) ($params['activate'] ?? true);

        if (!$slug) throw new Exception('Slug du plugin requis');

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin-install.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';

        // Récupérer les infos du plugin
        $api = plugins_api('plugin_information', ['slug' => $slug]);
        if (is_wp_error($api)) {
            throw new Exception("Plugin '$slug' introuvable dans le répertoire WordPress.");
        }

        // Installer
        $upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
        $result   = $upgrader->install($api->download_link);

        if (is_wp_error($result)) {
            throw new Exception($result->get_error_message());
        }

        $plugin_file = $this->_find_plugin_file($slug);
        $activated   = false;

        if ($activate && $plugin_file) {
            $activation = activate_plugin($plugin_file);
            $activated  = !is_wp_error($activation);
        }

        return [
            'success'   => true,
            'slug'      => $slug,
            'name'      => $api->name,
            'version'   => $api->version,
            'installed' => true,
            'activated' => $activated,
        ];
    }

    public function wp_toggle_plugin(array $params): array {
        $slug   = sanitize_text_field($params['slug'] ?? '');
        $action = sanitize_text_field($params['action'] ?? '');

        if (!$slug || !$action) throw new Exception('Slug et action requis');
        if (!function_exists('activate_plugin')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $plugin_file = $this->_find_plugin_file($slug);
        if (!$plugin_file) throw new Exception("Plugin '$slug' introuvable");

        if ($action === 'activate') {
            $result = activate_plugin($plugin_file);
            if (is_wp_error($result)) throw new Exception($result->get_error_message());
            return ['success' => true, 'action' => 'activated', 'plugin' => $slug];
        } elseif ($action === 'deactivate') {
            deactivate_plugins($plugin_file);
            return ['success' => true, 'action' => 'deactivated', 'plugin' => $slug];
        }

        throw new Exception("Action '$action' non valide");
    }

    public function wp_update_plugins(array $params): array {
        $slugs = $params['slugs'] ?? [];

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/update.php';

        $updates = get_plugin_updates();
        $updated = [];
        $errors  = [];

        foreach ($updates as $file => $data) {
            $slug = dirname($file);
            if (!empty($slugs) && !in_array($slug, $slugs)) continue;

            $upgrader = new Plugin_Upgrader(new WP_Ajax_Upgrader_Skin());
            $result   = $upgrader->upgrade($file);

            if (is_wp_error($result)) {
                $errors[] = ['slug' => $slug, 'error' => $result->get_error_message()];
            } else {
                $updated[] = ['slug' => $slug, 'name' => $data->Name, 'version' => $data->update->new_version];
            }
        }

        return ['updated' => $updated, 'errors' => $errors, 'total_updated' => count($updated)];
    }

    // ─── Contenu ───────────────────────────────────────────

    public function wp_create_post(array $params): array {
        $type    = sanitize_key($params['type'] ?? 'post');
        $title   = sanitize_text_field($params['title'] ?? '');
        $content = wp_kses_post($params['content'] ?? '');
        $status  = sanitize_key($params['status'] ?? 'draft');

        if (!$title) throw new Exception('Titre requis');

        $post_data = [
            'post_type'    => $type,
            'post_title'   => $title,
            'post_content' => $content,
            'post_status'  => $status,
            'post_excerpt' => sanitize_text_field($params['excerpt'] ?? ''),
        ];

        $post_id = wp_insert_post($post_data, true);
        if (is_wp_error($post_id)) throw new Exception($post_id->get_error_message());

        // Catégories
        if (!empty($params['categories']) && $type === 'post') {
            $cat_ids = [];
            foreach ($params['categories'] as $cat_name) {
                $term = get_term_by('name', $cat_name, 'category') ?: wp_create_category($cat_name);
                if ($term && !is_wp_error($term)) $cat_ids[] = is_array($term) ? $term : $term->term_id;
            }
            wp_set_post_categories($post_id, $cat_ids);
        }

        // Tags
        if (!empty($params['tags']) && $type === 'post') {
            wp_set_post_tags($post_id, $params['tags']);
        }

        // Image à la une
        $image_info = '';
        if (!empty($params['image_url'])) {
            $attach_id = $this->_sideload_image($params['image_url'], $post_id, $title);
            if ($attach_id && !is_wp_error($attach_id)) {
                set_post_thumbnail($post_id, $attach_id);
                $image_info = 'Image définie';
            } else {
                $image_info = 'Image non définie (URL invalide ou inaccessible)';
            }
        }

        return [
            'success'   => true,
            'post_id'   => $post_id,
            'title'     => $title,
            'type'      => $type,
            'status'    => $status,
            'image'     => $image_info ?: 'Aucune image',
            'edit_link' => get_edit_post_link($post_id, 'raw'),
            'view_link' => get_permalink($post_id),
        ];
    }

    public function wp_list_posts(array $params): array {
        $type     = sanitize_key($params['type'] ?? 'post');
        $status   = sanitize_key($params['status'] ?? 'any');
        $per_page = min((int) ($params['per_page'] ?? 10), 50);

        $query = new WP_Query([
            'post_type'      => $type,
            'post_status'    => $status,
            'posts_per_page' => $per_page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);

        $posts = [];
        foreach ($query->posts as $post) {
            $posts[] = [
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'status'    => $post->post_status,
                'date'      => $post->post_date,
                'modified'  => $post->post_modified,
                'url'       => get_permalink($post->ID),
                'edit_link' => get_edit_post_link($post->ID, 'raw'),
            ];
        }

        return ['posts' => $posts, 'total' => $query->found_posts];
    }

    // ─── WooCommerce ───────────────────────────────────────

    public function wc_configure_store(array $params): array {
        if (!class_exists('WooCommerce')) {
            throw new Exception("WooCommerce n'est pas installé ou activé.");
        }

        $updated = [];

        if (!empty($params['currency'])) {
            update_option('woocommerce_currency', strtoupper($params['currency']));
            $updated[] = 'currency';
        }
        if (!empty($params['country'])) {
            update_option('woocommerce_default_country', strtoupper($params['country']));
            $updated[] = 'country';
        }
        if (isset($params['tax_enabled'])) {
            update_option('woocommerce_calc_taxes', $params['tax_enabled'] ? 'yes' : 'no');
            $updated[] = 'tax_enabled';
        }
        if (!empty($params['tax_rate'])) {
            $this->_create_tax_rate((float) $params['tax_rate'], $params['country'] ?? '');
            $updated[] = 'tax_rate';
        }
        if (!empty($params['timezone'])) {
            update_option('timezone_string', $params['timezone']);
            $updated[] = 'timezone';
        }

        return [
            'success' => true,
            'updated' => $updated,
            'settings' => [
                'currency' => get_woocommerce_currency(),
                'country'  => WC()->countries->get_base_country(),
                'taxes'    => get_option('woocommerce_calc_taxes'),
            ],
        ];
    }

    public function wc_create_product(array $params): array {
        if (!class_exists('WooCommerce')) {
            throw new Exception("WooCommerce n'est pas installé ou activé.");
        }

        $name  = sanitize_text_field($params['name'] ?? '');
        $price = sanitize_text_field($params['price'] ?? '');

        if (!$name || !$price) throw new Exception('Nom et prix requis');

        $product = new WC_Product_Simple();
        $product->set_name($name);
        $product->set_regular_price($price);
        $product->set_status($params['status'] ?? 'draft');

        if (!empty($params['description']))       $product->set_description(wp_kses_post($params['description']));
        if (!empty($params['short_description'])) $product->set_short_description(wp_kses_post($params['short_description']));
        if (!empty($params['sale_price']))        $product->set_sale_price($params['sale_price']);
        if (!empty($params['sku']))               $product->set_sku(sanitize_text_field($params['sku']));
        if (isset($params['manage_stock']))       $product->set_manage_stock((bool)$params['manage_stock']);
        if (isset($params['stock_quantity']))     $product->set_stock_quantity((int)$params['stock_quantity']);

        // Catégories
        if (!empty($params['categories'])) {
            $cat_ids = [];
            foreach ($params['categories'] as $cat_name) {
                $term = get_term_by('name', $cat_name, 'product_cat');
                if (!$term) {
                    $new_term = wp_insert_term($cat_name, 'product_cat');
                    if (!is_wp_error($new_term)) $cat_ids[] = $new_term['term_id'];
                } else {
                    $cat_ids[] = $term->term_id;
                }
            }
            $product->set_category_ids($cat_ids);
        }

        $product_id = $product->save();

        // Image à la une
        $image_info = '';
        if (!empty($params['image_url'])) {
            $attach_id = $this->_sideload_image($params['image_url'], $product_id, $name);
            if ($attach_id && !is_wp_error($attach_id)) {
                $product->set_image_id($attach_id);
                $product->save();
                $image_info = 'Image définie';
            } else {
                $image_info = 'Image non définie (URL invalide ou inaccessible)';
            }
        }

        return [
            'success'    => true,
            'product_id' => $product_id,
            'name'       => $name,
            'price'      => $price,
            'status'     => $params['status'] ?? 'draft',
            'image'      => $image_info ?: 'Aucune image',
            'edit_link'  => get_edit_post_link($product_id, 'raw'),
        ];
    }

    public function wc_list_products(array $params): array {
        if (!class_exists('WooCommerce')) {
            throw new Exception("WooCommerce n'est pas installé ou activé.");
        }

        $per_page = min((int) ($params['per_page'] ?? 10), 50);
        $status   = sanitize_key($params['status'] ?? 'any');

        $args = [
            'post_type'      => 'product',
            'post_status'    => $status,
            'posts_per_page' => $per_page,
        ];

        if (!empty($params['category'])) {
            $args['tax_query'] = [[
                'taxonomy' => 'product_cat',
                'field'    => 'name',
                'terms'    => $params['category'],
            ]];
        }

        $query    = new WP_Query($args);
        $products = [];

        foreach ($query->posts as $post) {
            $product    = wc_get_product($post->ID);
            $products[] = [
                'id'       => $post->ID,
                'name'     => $product->get_name(),
                'price'    => $product->get_price(),
                'status'   => $post->post_status,
                'sku'      => $product->get_sku(),
                'type'     => $product->get_type(),
                'edit_link' => get_edit_post_link($post->ID, 'raw'),
            ];
        }

        return ['products' => $products, 'total' => $query->found_posts];
    }

    // ─── Audit ─────────────────────────────────────────────

    public function wp_audit(array $params): array {
        global $wp_version;
        $type = $params['type'] ?? 'full';

        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/update.php';

        $report = ['type' => $type, 'generated_at' => current_time('mysql')];

        if (in_array($type, ['full', 'updates'])) {
            $plugin_updates = get_plugin_updates();
            $report['updates'] = [
                'plugins_to_update' => count($plugin_updates),
                'plugins'           => array_map(function($f, $d) {
                    return [
                        'name'        => $d->Name,
                        'current'     => $d->Version,
                        'new_version' => $d->update->new_version,
                    ];
                }, array_keys($plugin_updates), array_values($plugin_updates)),
            ];
        }

        if (in_array($type, ['full', 'security'])) {
            $report['security'] = [
                'wp_version_current' => version_compare($wp_version, '6.0', '>='),
                'file_editor_disabled' => defined('DISALLOW_FILE_EDIT') && DISALLOW_FILE_EDIT,
                'debug_mode_off'       => !WP_DEBUG,
                'ssl_active'           => is_ssl(),
                'admin_user_renamed'   => !username_exists('admin'),
            ];
        }

        if (in_array($type, ['full', 'performance'])) {
            $report['performance'] = [
                'object_cache_active' => wp_using_ext_object_cache(),
                'php_version'         => PHP_VERSION,
                'php_version_ok'      => version_compare(PHP_VERSION, '8.0', '>='),
                'memory_limit'        => WP_MEMORY_LIMIT,
            ];
        }

        return $report;
    }

    // ─── Helpers privés ────────────────────────────────────

    private function _find_plugin_file($slug) {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        foreach (array_keys(get_plugins()) as $file) {
            if (strpos($file, $slug . '/') === 0 || $file === $slug . '.php') {
                return $file;
            }
        }
        return null;
    }

    private function _get_active_plugin_names(): array {
        if (!function_exists('get_plugins')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }
        $active_files = get_option('active_plugins', []);
        $all_plugins  = get_plugins();
        $names        = [];
        foreach ($active_files as $file) {
            if (isset($all_plugins[$file])) {
                $names[] = $all_plugins[$file]['Name'];
            }
        }
        return $names;
    }

    private function _create_tax_rate($rate, $country) {
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'woocommerce_tax_rates', [
            'tax_rate_country'  => $country,
            'tax_rate'          => $rate,
            'tax_rate_name'     => 'TVA',
            'tax_rate_priority' => 1,
            'tax_rate_compound' => 0,
            'tax_rate_shipping' => 1,
            'tax_rate_order'    => 0,
            'tax_rate_class'    => '',
        ]);
    }

    // ═══════════════════════════════════════════════════════
    // ─── WooCommerce Avancé ───────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wc_list_orders($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $status   = $params['status'] ?? 'any';
        $per_page = min((int)($params['per_page'] ?? 10), 50);

        $orders = wc_get_orders([
            'limit'   => $per_page,
            'status'  => $status,
            'orderby' => 'date',
            'order'   => 'DESC',
        ]);

        $result = [];
        foreach ($orders as $order) {
            $result[] = [
                'id'       => $order->get_id(),
                'status'   => $order->get_status(),
                'total'    => $order->get_total(),
                'currency' => $order->get_currency(),
                'customer' => $order->get_billing_first_name() . ' ' . $order->get_billing_last_name(),
                'email'    => $order->get_billing_email(),
                'date'     => $order->get_date_created() ? $order->get_date_created()->date('Y-m-d H:i') : '',
                'items'    => $order->get_item_count(),
            ];
        }
        return ['orders' => $result, 'total' => count($result)];
    }

    public function wc_update_order($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $order_id = (int)($params['order_id'] ?? 0);
        if (!$order_id) throw new Exception("ID de commande requis.");
        $order = wc_get_order($order_id);
        if (!$order) throw new Exception("Commande #{$order_id} introuvable.");

        if (!empty($params['status'])) {
            $order->update_status(sanitize_key($params['status']), $params['note'] ?? '');
        }
        if (!empty($params['note'])) {
            $order->add_order_note(sanitize_text_field($params['note']));
        }

        return [
            'success'    => true,
            'order_id'   => $order_id,
            'new_status' => $order->get_status(),
        ];
    }

    public function wc_create_coupon($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $code = sanitize_text_field($params['code'] ?? '');
        if (!$code) throw new Exception("Code coupon requis.");

        $coupon = new WC_Coupon();
        $coupon->set_code($code);
        $coupon->set_discount_type($params['type'] ?? 'percent');
        $coupon->set_amount($params['amount'] ?? 0);

        if (isset($params['free_shipping']))   $coupon->set_free_shipping((bool)$params['free_shipping']);
        if (!empty($params['expiry_date']))    $coupon->set_date_expires($params['expiry_date']);
        if (isset($params['min_amount']))      $coupon->set_minimum_amount($params['min_amount']);
        if (isset($params['max_amount']))      $coupon->set_maximum_amount($params['max_amount']);
        if (isset($params['usage_limit']))     $coupon->set_usage_limit((int)$params['usage_limit']);
        if (isset($params['individual_use']))  $coupon->set_individual_use((bool)$params['individual_use']);

        $coupon_id = $coupon->save();
        return ['success' => true, 'coupon_id' => $coupon_id, 'code' => $code, 'type' => $params['type'] ?? 'percent', 'amount' => $params['amount'] ?? 0];
    }

    public function wc_list_coupons($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $per_page = min((int)($params['per_page'] ?? 10), 50);

        $coupons_query = new WP_Query([
            'post_type'      => 'shop_coupon',
            'posts_per_page' => $per_page,
            'post_status'    => 'publish',
        ]);

        $coupons = [];
        foreach ($coupons_query->posts as $post) {
            $c = new WC_Coupon($post->ID);
            $coupons[] = [
                'id'          => $post->ID,
                'code'        => $c->get_code(),
                'type'        => $c->get_discount_type(),
                'amount'      => $c->get_amount(),
                'usage_count' => $c->get_usage_count(),
                'usage_limit' => $c->get_usage_limit(),
                'expiry'      => $c->get_date_expires() ? $c->get_date_expires()->date('Y-m-d') : 'Aucune',
            ];
        }
        return ['coupons' => $coupons, 'total' => $coupons_query->found_posts];
    }

    public function wc_setup_shipping($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $zone_name = sanitize_text_field($params['zone_name'] ?? 'France');
        $method    = sanitize_key($params['method'] ?? 'flat_rate');

        $zone = new WC_Shipping_Zone();
        $zone->set_zone_name($zone_name);
        if (!empty($params['country'])) {
            $zone->add_location(strtoupper($params['country']), 'country');
        }
        $zone->save();

        $instance_id = $zone->add_shipping_method($method);
        $result = ['success' => true, 'zone_id' => $zone->get_id(), 'zone_name' => $zone_name, 'method' => $method];

        if ($method === 'flat_rate' && isset($params['cost'])) {
            $options = get_option("woocommerce_flat_rate_{$instance_id}_settings", []);
            $options['cost'] = $params['cost'];
            update_option("woocommerce_flat_rate_{$instance_id}_settings", $options);
            $result['cost'] = $params['cost'];
        }
        if ($method === 'free_shipping' && isset($params['min_amount'])) {
            $options = get_option("woocommerce_free_shipping_{$instance_id}_settings", []);
            $options['requires']  = 'min_amount';
            $options['min_amount'] = $params['min_amount'];
            update_option("woocommerce_free_shipping_{$instance_id}_settings", $options);
            $result['min_amount'] = $params['min_amount'];
        }
        return $result;
    }

    public function wc_list_payment_gateways($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $gateways = WC()->payment_gateways()->payment_gateways();
        $result   = [];
        foreach ($gateways as $gw) {
            $result[] = [
                'id'          => $gw->id,
                'title'       => $gw->get_title(),
                'enabled'     => $gw->enabled === 'yes',
                'description' => $gw->get_description(),
            ];
        }

        if (!empty($params['toggle']) && !empty($params['gateway_id'])) {
            foreach ($gateways as $gw) {
                if ($gw->id === $params['gateway_id']) {
                    $gw->update_option('enabled', $params['toggle'] === 'enable' ? 'yes' : 'no');
                    return ['success' => true, 'gateway' => $gw->id, 'action' => $params['toggle']];
                }
            }
        }
        return ['gateways' => $result];
    }

    public function wc_get_sales_report($params) {
        if (!class_exists('WooCommerce')) throw new Exception("WooCommerce non activé.");
        $days = (int)($params['days'] ?? 30);
        $after = date('Y-m-d', strtotime("-{$days} days"));

        $orders = wc_get_orders(['date_after' => $after, 'status' => ['completed', 'processing'], 'limit' => -1]);
        $total_revenue = 0;
        $total_items   = 0;
        $products      = [];

        foreach ($orders as $order) {
            $total_revenue += (float)$order->get_total();
            foreach ($order->get_items() as $item) {
                $name = $item->get_name();
                $qty  = $item->get_quantity();
                $total_items += $qty;
                if (!isset($products[$name])) $products[$name] = 0;
                $products[$name] += $qty;
            }
        }
        arsort($products);

        return [
            'period'          => "{$days} derniers jours",
            'total_orders'    => count($orders),
            'total_revenue'   => round($total_revenue, 2),
            'currency'        => get_woocommerce_currency(),
            'total_items_sold'=> $total_items,
            'top_products'    => array_slice($products, 0, 5, true),
            'avg_order_value' => count($orders) > 0 ? round($total_revenue / count($orders), 2) : 0,
        ];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Thèmes & Builders ────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_list_themes($params) {
        $themes = wp_get_themes();
        $active = get_stylesheet();
        $result = [];
        foreach ($themes as $slug => $theme) {
            $result[] = [
                'slug'    => $slug,
                'name'    => $theme->get('Name'),
                'version' => $theme->get('Version'),
                'active'  => ($slug === $active),
                'author'  => $theme->get('Author'),
            ];
        }
        return ['themes' => $result, 'active_theme' => $active];
    }

    public function wp_install_theme($params) {
        $slug = sanitize_key($params['slug'] ?? '');
        if (!$slug) throw new Exception("Slug du thème requis.");

        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/theme.php';

        $api = themes_api('theme_information', ['slug' => $slug, 'fields' => ['sections' => false]]);
        if (is_wp_error($api)) throw new Exception("Thème '{$slug}' introuvable.");

        $upgrader = new Theme_Upgrader(new Automatic_Upgrader_Skin());
        $result   = $upgrader->install($api->download_link);
        if (is_wp_error($result)) throw new Exception($result->get_error_message());

        if (!empty($params['activate'])) {
            switch_theme($slug);
        }
        return ['success' => true, 'slug' => $slug, 'activated' => !empty($params['activate'])];
    }

    public function wp_setup_builder($params) {
        $builder = strtolower(sanitize_text_field($params['builder'] ?? ''));
        if (!$builder) throw new Exception("Nom du builder requis (elementor, divi, bricks, beaver, gutenberg).");

        $presets = [
            'elementor' => [
                'plugins' => ['elementor', 'starter-templates'],
                'theme'   => 'hello-elementor',
                'label'   => 'Elementor',
            ],
            'divi' => [
                'plugins' => [],
                'theme'   => 'flavor',
                'label'   => 'Divi (nécessite licence)',
                'note'    => 'Divi nécessite un achat sur elegantthemes.com. Thème alternatif installé.',
            ],
            'beaver' => [
                'plugins' => ['beaver-builder-lite-version'],
                'theme'   => 'flavor',
                'label'   => 'Beaver Builder',
            ],
            'bricks' => [
                'plugins' => [],
                'theme'   => 'flavor',
                'label'   => 'Bricks (nécessite licence)',
                'note'    => 'Bricks nécessite un achat sur bricksbuilder.io.',
            ],
            'gutenberg' => [
                'plugins' => ['starter-templates'],
                'theme'   => 'flavor',
                'label'   => 'Gutenberg (Full Site Editing)',
            ],
        ];

        if (!isset($presets[$builder])) {
            throw new Exception("Builder inconnu. Choix possibles : " . implode(', ', array_keys($presets)));
        }

        $preset   = $presets[$builder];
        $installed = [];
        $errors    = [];

        // Install plugins
        foreach ($preset['plugins'] as $slug) {
            try {
                $this->wp_install_plugin(['slug' => $slug, 'activate' => true]);
                $installed[] = $slug;
            } catch (Exception $e) {
                $errors[] = $slug . ': ' . $e->getMessage();
            }
        }

        // Install & activate theme
        try {
            $this->wp_install_theme(['slug' => $preset['theme'], 'activate' => true]);
        } catch (Exception $e) {
            $errors[] = 'theme: ' . $e->getMessage();
        }

        $result = [
            'success'   => count($errors) === 0,
            'builder'   => $preset['label'],
            'installed' => $installed,
            'theme'     => $preset['theme'],
        ];
        if (!empty($preset['note']))  $result['note']   = $preset['note'];
        if (!empty($errors))          $result['errors'] = $errors;
        return $result;
    }

    // ═══════════════════════════════════════════════════════
    // ─── SEO ──────────────────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_setup_seo($params) {
        $plugin = strtolower($params['plugin'] ?? 'yoast');
        $slugs  = [
            'yoast'    => 'wordpress-seo',
            'rankmath' => 'seo-by-rank-math',
            'aioseo'   => 'all-in-one-seo-pack',
        ];

        $slug = $slugs[$plugin] ?? $slugs['yoast'];
        $this->wp_install_plugin(['slug' => $slug, 'activate' => true]);

        // Basic permalink config
        global $wp_rewrite;
        $wp_rewrite->set_permalink_structure('/%postname%/');
        $wp_rewrite->flush_rules();

        return [
            'success'    => true,
            'plugin'     => $plugin,
            'slug'       => $slug,
            'permalinks' => '/%postname%/',
            'tip'        => 'Rendez-vous dans les réglages du plugin SEO pour finaliser la configuration.',
        ];
    }

    public function wp_set_meta($params) {
        $post_id = (int)($params['post_id'] ?? 0);
        if (!$post_id) throw new Exception("ID du post requis.");
        if (!get_post($post_id)) throw new Exception("Post #{$post_id} introuvable.");

        $updated = [];
        if (!empty($params['title'])) {
            update_post_meta($post_id, '_yoast_wpseo_title', sanitize_text_field($params['title']));
            update_post_meta($post_id, 'rank_math_title', sanitize_text_field($params['title']));
            $updated[] = 'title';
        }
        if (!empty($params['description'])) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', sanitize_text_field($params['description']));
            update_post_meta($post_id, 'rank_math_description', sanitize_text_field($params['description']));
            $updated[] = 'description';
        }
        return ['success' => true, 'post_id' => $post_id, 'updated' => $updated];
    }

    public function wp_configure_permalinks($params) {
        $structure = sanitize_text_field($params['structure'] ?? '/%postname%/');
        global $wp_rewrite;
        $wp_rewrite->set_permalink_structure($structure);
        $wp_rewrite->flush_rules();
        return ['success' => true, 'structure' => $structure];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Sécurité ─────────────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_setup_security($params) {
        $actions = [];

        // Install security plugin
        $plugin = strtolower($params['plugin'] ?? 'wordfence');
        $slugs = ['wordfence' => 'wordfence', 'sucuri' => 'sucuri-scanner', 'ithemes' => 'better-wp-security'];
        $slug  = $slugs[$plugin] ?? 'wordfence';
        try {
            $this->wp_install_plugin(['slug' => $slug, 'activate' => true]);
            $actions[] = "Plugin {$plugin} installé et activé";
        } catch (Exception $e) {
            $actions[] = "Plugin {$plugin}: " . $e->getMessage();
        }

        // Harden WP
        $hardening = $this->wp_harden([]);
        $actions = array_merge($actions, $hardening['actions']);

        return ['success' => true, 'actions' => $actions];
    }

    public function wp_setup_backup($params) {
        try {
            $this->wp_install_plugin(['slug' => 'updraftplus', 'activate' => true]);
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }

        // Configure schedule
        $schedule = $params['schedule'] ?? 'weekly';
        update_option('updraft_interval', $schedule);
        update_option('updraft_interval_database', 'daily');
        update_option('updraft_retain', 3);
        update_option('updraft_retain_db', 7);

        return [
            'success'  => true,
            'plugin'   => 'UpdraftPlus',
            'schedule' => ['files' => $schedule, 'database' => 'daily'],
            'retain'   => ['files' => 3, 'database' => 7],
        ];
    }

    public function wp_harden($params) {
        $actions = [];

        // Disable file editor
        if (!defined('DISALLOW_FILE_EDIT') || !DISALLOW_FILE_EDIT) {
            $actions[] = "⚠️ Ajoutez define('DISALLOW_FILE_EDIT', true); dans wp-config.php";
        } else {
            $actions[] = "✅ Éditeur de fichiers déjà désactivé";
        }

        // Disable XML-RPC
        add_filter('xmlrpc_enabled', '__return_false');
        $actions[] = "✅ XML-RPC désactivé";

        // Hide WP version
        remove_action('wp_head', 'wp_generator');
        $actions[] = "✅ Version WordPress masquée";

        // Block author enumeration
        if (!is_admin()) {
            add_action('template_redirect', function() {
                if (isset($_REQUEST['author'])) {
                    wp_redirect(home_url(), 301);
                    exit;
                }
            });
        }
        $actions[] = "✅ Énumération d'auteurs bloquée";

        // SSL check
        $actions[] = is_ssl() ? "✅ SSL actif" : "⚠️ SSL non actif — activez HTTPS";

        // Admin user check
        $actions[] = !username_exists('admin') ? "✅ Pas de compte 'admin'" : "⚠️ Renommez le compte 'admin'";

        return ['success' => true, 'actions' => $actions];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Performance ──────────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_setup_cache($params) {
        $plugin = strtolower($params['plugin'] ?? 'litespeed');
        $slugs = [
            'litespeed'   => 'litespeed-cache',
            'wpsc'        => 'wp-super-cache',
            'w3tc'        => 'w3-total-cache',
            'autoptimize' => 'autoptimize',
        ];
        $slug = $slugs[$plugin] ?? $slugs['litespeed'];

        $this->wp_install_plugin(['slug' => $slug, 'activate' => true]);

        // Also install Autoptimize for minification if not already the main choice
        if ($plugin !== 'autoptimize') {
            try {
                $this->wp_install_plugin(['slug' => 'autoptimize', 'activate' => true]);
            } catch (Exception $e) { /* ignore */ }
        }

        return [
            'success' => true,
            'plugins' => [$slug, 'autoptimize'],
            'tip'     => "Configurez {$plugin} depuis Réglages → {$plugin} dans l'admin WordPress.",
        ];
    }

    public function wp_optimize_db($params) {
        global $wpdb;
        $actions = [];

        // Delete post revisions
        $revisions = $wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_type = 'revision'");
        $actions[] = "🗑 {$revisions} révisions supprimées";

        // Delete auto-drafts
        $drafts = $wpdb->query("DELETE FROM {$wpdb->posts} WHERE post_status = 'auto-draft'");
        $actions[] = "🗑 {$drafts} brouillons auto supprimés";

        // Delete spam comments
        $spam = $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'");
        $actions[] = "🗑 {$spam} commentaires spam supprimés";

        // Delete trashed comments
        $trash = $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'trash'");
        $actions[] = "🗑 {$trash} commentaires corbeille supprimés";

        // Clean transients
        $transients = $wpdb->query("DELETE FROM {$wpdb->options} WHERE option_name LIKE '%_transient_%'");
        $actions[] = "🗑 {$transients} transients nettoyés";

        // Optimize tables
        $tables = $wpdb->get_results("SHOW TABLES", ARRAY_N);
        foreach ($tables as $table) {
            $wpdb->query("OPTIMIZE TABLE {$table[0]}");
        }
        $actions[] = "✅ " . count($tables) . " tables optimisées";

        return ['success' => true, 'actions' => $actions];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Utilisateurs ─────────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_list_users($params) {
        $role     = sanitize_key($params['role'] ?? '');
        $per_page = min((int)($params['per_page'] ?? 20), 50);

        $args = ['number' => $per_page, 'orderby' => 'registered', 'order' => 'DESC'];
        if ($role) $args['role'] = $role;

        $users  = get_users($args);
        $result = [];
        foreach ($users as $user) {
            $result[] = [
                'id'         => $user->ID,
                'login'      => $user->user_login,
                'email'      => $user->user_email,
                'name'       => $user->display_name,
                'role'       => implode(', ', $user->roles),
                'registered' => $user->user_registered,
            ];
        }
        return ['users' => $result, 'total' => count_users()['total_users']];
    }

    public function wp_create_user($params) {
        $username = sanitize_user($params['username'] ?? '');
        $email    = sanitize_email($params['email'] ?? '');
        $role     = sanitize_key($params['role'] ?? 'subscriber');

        if (!$username || !$email) throw new Exception("Nom d'utilisateur et email requis.");
        if (username_exists($username)) throw new Exception("L'utilisateur '{$username}' existe déjà.");
        if (email_exists($email)) throw new Exception("L'email '{$email}' est déjà utilisé.");

        $password = $params['password'] ?? wp_generate_password(16, true, true);
        $user_id  = wp_create_user($username, $password, $email);

        if (is_wp_error($user_id)) throw new Exception($user_id->get_error_message());

        $user = new WP_User($user_id);
        $user->set_role($role);

        if (!empty($params['name'])) {
            wp_update_user(['ID' => $user_id, 'display_name' => sanitize_text_field($params['name'])]);
        }

        return [
            'success'  => true,
            'user_id'  => $user_id,
            'username' => $username,
            'email'    => $email,
            'role'     => $role,
            'password' => empty($params['password']) ? $password : '(défini par l\'utilisateur)',
        ];
    }

    public function wp_manage_user($params) {
        $user_id = (int)($params['user_id'] ?? 0);
        if (!$user_id) throw new Exception("ID utilisateur requis.");
        $user = get_userdata($user_id);
        if (!$user) throw new Exception("Utilisateur #{$user_id} introuvable.");

        $actions = [];

        if (!empty($params['role'])) {
            $wp_user = new WP_User($user_id);
            $wp_user->set_role(sanitize_key($params['role']));
            $actions[] = "Rôle changé en {$params['role']}";
        }
        if (!empty($params['reset_password'])) {
            $new_pass = wp_generate_password(16, true, true);
            wp_set_password($new_pass, $user_id);
            $actions[] = "Mot de passe réinitialisé";
            return ['success' => true, 'user_id' => $user_id, 'actions' => $actions, 'new_password' => $new_pass];
        }
        if (!empty($params['delete']) && $user_id !== get_current_user_id()) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
            wp_delete_user($user_id);
            $actions[] = "Utilisateur supprimé";
        }

        return ['success' => true, 'user_id' => $user_id, 'actions' => $actions];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Médias & Contenu ─────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_list_media($params) {
        $per_page  = min((int)($params['per_page'] ?? 20), 50);
        $mime_type = sanitize_mime_type($params['type'] ?? '');

        $args = [
            'post_type'      => 'attachment',
            'post_status'    => 'inherit',
            'posts_per_page' => $per_page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ];
        if ($mime_type) $args['post_mime_type'] = $mime_type;

        $query = new WP_Query($args);
        $media = [];
        foreach ($query->posts as $post) {
            $media[] = [
                'id'       => $post->ID,
                'title'    => $post->post_title,
                'url'      => wp_get_attachment_url($post->ID),
                'type'     => $post->post_mime_type,
                'size'     => size_format(filesize(get_attached_file($post->ID)) ?: 0),
                'date'     => $post->post_date,
            ];
        }
        return ['media' => $media, 'total' => $query->found_posts];
    }

    public function wp_manage_comments($params) {
        $action = sanitize_key($params['action'] ?? 'list');

        if ($action === 'list') {
            $status   = $params['status'] ?? 'all';
            $per_page = min((int)($params['per_page'] ?? 20), 50);
            $comments = get_comments(['status' => $status, 'number' => $per_page, 'orderby' => 'comment_date', 'order' => 'DESC']);
            $result   = [];
            foreach ($comments as $c) {
                $result[] = [
                    'id'      => $c->comment_ID,
                    'author'  => $c->comment_author,
                    'email'   => $c->comment_author_email,
                    'content' => wp_trim_words($c->comment_content, 20),
                    'status'  => $c->comment_approved,
                    'date'    => $c->comment_date,
                    'post'    => get_the_title($c->comment_post_ID),
                ];
            }
            return ['comments' => $result, 'counts' => wp_count_comments()];
        }

        if ($action === 'delete_spam') {
            global $wpdb;
            $deleted = $wpdb->query("DELETE FROM {$wpdb->comments} WHERE comment_approved = 'spam'");
            return ['success' => true, 'deleted' => $deleted];
        }

        if ($action === 'approve' && !empty($params['comment_id'])) {
            wp_set_comment_status((int)$params['comment_id'], 'approve');
            return ['success' => true, 'comment_id' => (int)$params['comment_id'], 'status' => 'approved'];
        }

        return ['error' => 'Action inconnue'];
    }

    public function wp_manage_menu($params) {
        $action    = sanitize_key($params['action'] ?? 'list');
        $menu_name = sanitize_text_field($params['menu_name'] ?? '');

        if ($action === 'list') {
            $menus  = wp_get_nav_menus();
            $result = [];
            foreach ($menus as $menu) {
                $items = wp_get_nav_menu_items($menu->term_id);
                $result[] = [
                    'id'    => $menu->term_id,
                    'name'  => $menu->name,
                    'count' => count($items ?: []),
                    'items' => array_map(function($item) {
                        return ['title' => $item->title, 'url' => $item->url, 'type' => $item->type];
                    }, $items ?: []),
                ];
            }
            return ['menus' => $result];
        }

        if ($action === 'create' && $menu_name) {
            $menu_id = wp_create_nav_menu($menu_name);
            if (is_wp_error($menu_id)) throw new Exception($menu_id->get_error_message());
            return ['success' => true, 'menu_id' => $menu_id, 'name' => $menu_name];
        }

        if ($action === 'add_item' && !empty($params['menu_id'])) {
            $item_data = [
                'menu-item-title'   => sanitize_text_field($params['title'] ?? ''),
                'menu-item-url'     => esc_url($params['url'] ?? ''),
                'menu-item-status'  => 'publish',
            ];
            if (!empty($params['page_id'])) {
                $item_data['menu-item-object-id'] = (int)$params['page_id'];
                $item_data['menu-item-object']    = 'page';
                $item_data['menu-item-type']      = 'post_type';
            } else {
                $item_data['menu-item-type'] = 'custom';
            }

            $item_id = wp_update_nav_menu_item((int)$params['menu_id'], 0, $item_data);
            if (is_wp_error($item_id)) throw new Exception($item_id->get_error_message());
            return ['success' => true, 'item_id' => $item_id];
        }

        return ['error' => 'Action inconnue'];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Maintenance ──────────────────────────────────────
    // ═══════════════════════════════════════════════════════

    public function wp_update_settings($params) {
        $updated = [];
        $map = [
            'site_title'       => 'blogname',
            'tagline'          => 'blogdescription',
            'timezone'         => 'timezone_string',
            'date_format'      => 'date_format',
            'time_format'      => 'time_format',
            'language'         => 'WPLANG',
            'posts_per_page'   => 'posts_per_page',
            'admin_email'      => 'admin_email',
            'registration'     => 'users_can_register',
        ];

        foreach ($map as $param_key => $option_key) {
            if (isset($params[$param_key])) {
                $value = $param_key === 'registration' ? ($params[$param_key] ? 1 : 0) : sanitize_text_field($params[$param_key]);
                update_option($option_key, $value);
                $updated[$param_key] = $value;
            }
        }

        if (empty($updated)) throw new Exception("Aucun paramètre à mettre à jour.");
        return ['success' => true, 'updated' => $updated];
    }

    public function wp_bulk_action($params) {
        $action = sanitize_key($params['action'] ?? '');
        $results = [];

        if ($action === 'update_all_plugins') {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
            require_once ABSPATH . 'wp-admin/includes/update.php';

            $updates = get_plugin_updates();
            $upgrader = new Plugin_Upgrader(new Automatic_Upgrader_Skin());

            foreach ($updates as $file => $data) {
                $result = $upgrader->upgrade($file);
                $results[] = [
                    'plugin'  => $data->Name,
                    'success' => !is_wp_error($result) && $result,
                ];
            }
            return ['success' => true, 'action' => 'update_all_plugins', 'results' => $results];
        }

        if ($action === 'update_all_themes') {
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
            require_once ABSPATH . 'wp-admin/includes/theme.php';
            require_once ABSPATH . 'wp-admin/includes/update.php';

            $updates  = get_theme_updates();
            $upgrader = new Theme_Upgrader(new Automatic_Upgrader_Skin());

            foreach ($updates as $slug => $theme) {
                $result = $upgrader->upgrade($slug);
                $results[] = [
                    'theme'   => $theme->get('Name'),
                    'success' => !is_wp_error($result) && $result,
                ];
            }
            return ['success' => true, 'action' => 'update_all_themes', 'results' => $results];
        }

        if ($action === 'delete_inactive_plugins') {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
            $all    = get_plugins();
            $active = get_option('active_plugins', []);
            foreach ($all as $file => $data) {
                if (!in_array($file, $active) && strpos($file, 'wp-agent') === false) {
                    delete_plugins([$file]);
                    $results[] = ['plugin' => $data['Name'], 'deleted' => true];
                }
            }
            return ['success' => true, 'action' => 'delete_inactive_plugins', 'results' => $results];
        }

        throw new Exception("Action inconnue. Choix : update_all_plugins, update_all_themes, delete_inactive_plugins");
    }

    public function wp_clear_cache($params) {
        $cleared = [];

        // WP Super Cache
        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
            $cleared[] = 'WP Super Cache';
        }
        // LiteSpeed Cache
        if (class_exists('LiteSpeed_Cache_API')) {
            do_action('litespeed_purge_all');
            $cleared[] = 'LiteSpeed Cache';
        }
        // W3 Total Cache
        if (function_exists('w3tc_flush_all')) {
            w3tc_flush_all();
            $cleared[] = 'W3 Total Cache';
        }
        // WP object cache
        wp_cache_flush();
        $cleared[] = 'WP Object Cache';

        return ['success' => true, 'cleared' => $cleared];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Produit Variable WooCommerce ─────────────────────
    // ═══════════════════════════════════════════════════════

    public function wc_create_variable_product(array $params): array {
        if (!class_exists('WooCommerce')) {
            throw new Exception("WooCommerce n'est pas installé ou activé.");
        }

        $name = sanitize_text_field($params['name'] ?? '');
        if (!$name) throw new Exception('Nom du produit requis');

        // Décoder les attributs et variations passés en JSON string
        $attributes_raw = $params['attributes_json'] ?? '[]';
        $variations_raw = $params['variations_json'] ?? '[]';

        $attributes_data = json_decode($attributes_raw, true);
        $variations_data = json_decode($variations_raw, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($attributes_data)) {
            throw new Exception('attributes_json invalide : JSON mal formé');
        }
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($variations_data)) {
            throw new Exception('variations_json invalide : JSON mal formé');
        }

        // Créer le produit variable
        $product = new WC_Product_Variable();
        $product->set_name($name);
        $product->set_status($params['status'] ?? 'draft');

        if (!empty($params['description']))       $product->set_description(wp_kses_post($params['description']));
        if (!empty($params['short_description'])) $product->set_short_description(wp_kses_post($params['short_description']));
        if (!empty($params['sku']))               $product->set_sku(sanitize_text_field($params['sku']));

        // Catégories
        if (!empty($params['categories'])) {
            $cat_ids = [];
            foreach ($params['categories'] as $cat_name) {
                $term = get_term_by('name', $cat_name, 'product_cat');
                if (!$term) {
                    $new_term = wp_insert_term($cat_name, 'product_cat');
                    if (!is_wp_error($new_term)) $cat_ids[] = $new_term['term_id'];
                } else {
                    $cat_ids[] = $term->term_id;
                }
            }
            $product->set_category_ids($cat_ids);
        }

        // Attributs (ex: Couleur => [Rouge, Bleu], Taille => [S, M, L])
        $wc_attributes = [];
        foreach ($attributes_data as $attr) {
            $attr_name   = sanitize_text_field($attr['name'] ?? '');
            $attr_values = array_map('sanitize_text_field', $attr['values'] ?? []);
            if (!$attr_name || empty($attr_values)) continue;

            $attribute = new WC_Product_Attribute();
            $attribute->set_name($attr_name);
            $attribute->set_options($attr_values);
            $attribute->set_position(count($wc_attributes));
            $attribute->set_visible(true);
            $attribute->set_variation(true);
            $wc_attributes[] = $attribute;
        }
        $product->set_attributes($wc_attributes);
        $product_id = $product->save();

        // Image à la une
        $image_info = '';
        if (!empty($params['image_url'])) {
            $attach_id = $this->_sideload_image($params['image_url'], $product_id, $name);
            if ($attach_id && !is_wp_error($attach_id)) {
                $product->set_image_id($attach_id);
                $product->save();
                $image_info = 'Image définie';
            } else {
                $image_info = 'Image non définie (URL invalide ou inaccessible)';
            }
        }

        // Variations
        $created_variations = 0;
        foreach ($variations_data as $var_data) {
            $variation = new WC_Product_Variation();
            $variation->set_parent_id($product_id);

            // Attributs de la variation (ex: {"Couleur":"Rouge","Taille":"S"})
            $var_attrs = [];
            foreach ($var_data as $key => $val) {
                if (in_array($key, ['price', 'sale_price', 'sku', 'stock', 'manage_stock', 'image_url'], true)) continue;
                $var_attrs[sanitize_title($key)] = sanitize_text_field($val);
            }
            $variation->set_attributes($var_attrs);

            if (isset($var_data['price']))      $variation->set_regular_price(sanitize_text_field($var_data['price']));
            if (isset($var_data['sale_price'])) $variation->set_sale_price(sanitize_text_field($var_data['sale_price']));
            if (isset($var_data['sku']))        $variation->set_sku(sanitize_text_field($var_data['sku']));
            if (isset($var_data['stock'])) {
                $variation->set_manage_stock(true);
                $variation->set_stock_quantity((int)$var_data['stock']);
            }

            // Image spécifique à la variation
            if (!empty($var_data['image_url'])) {
                $var_img = $this->_sideload_image($var_data['image_url'], $product_id, $name . ' variation');
                if ($var_img && !is_wp_error($var_img)) $variation->set_image_id($var_img);
            }

            $variation->save();
            $created_variations++;
        }

        // Synchroniser les prix du produit variable
        WC_Product_Variable::sync($product_id);

        return [
            'success'    => true,
            'product_id' => $product_id,
            'name'       => $name,
            'type'       => 'variable',
            'attributes' => count($wc_attributes),
            'variations' => $created_variations,
            'image'      => $image_info ?: 'Aucune image',
            'status'     => $params['status'] ?? 'draft',
            'edit_link'  => get_edit_post_link($product_id, 'raw'),
        ];
    }

    // ═══════════════════════════════════════════════════════
    // ─── Helpers privés ───────────────────────────────────
    // ═══════════════════════════════════════════════════════

    /**
     * Télécharge une image depuis une URL et l'attache à un post.
     * Retourne l'ID de l'attachment ou WP_Error.
     */
    private function _sideload_image(string $url, int $post_id, string $title = '') {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $url = esc_url_raw($url);
        if (empty($url)) return false;

        return media_sideload_image($url, $post_id, sanitize_text_field($title), 'id');
    }

}

