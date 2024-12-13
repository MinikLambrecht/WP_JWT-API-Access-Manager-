<?php
/*
Plugin Name: JWT API Access Manager
Description: Extends the JWT Authentication for WP-API plugin by allowing selective authentication for specific WordPress REST API endpoints. This plugin enables administrators to control which API endpoints require authentication, providing fine-grained access management. Easily configure public and private endpoints via the WordPress admin settings, improving security while allowing non-sensitive endpoints to remain publicly accessible.
Version: 1.5
Author: Minik Lambrecht
*/

class Selective_Endpoint_Authentication {
    public function __construct() {
        add_filter('rest_authentication_errors', [$this, 'authenticate_endpoints']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'init_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('wp_ajax_get_rest_endpoints', [$this, 'get_rest_endpoints']);
    }

    public function authenticate_endpoints($result) {
		if (!is_user_logged_in()) {
			$public_endpoints = get_option('public_endpoints', []);
			global $wp;
			
			// Ensure the route starts with /wp-json/
			$current_route = '/wp-json/' . ltrim($wp->request, '/wp-json/');

			if (empty($public_endpoints)) {
				return $result;
			}

			// Debugging: Log endpoints
			error_log('Requested Route: ' . $current_route);
			error_log('Public Endpoints: ' . print_r($public_endpoints, true));

			foreach ($public_endpoints as $public_endpoint) {
				// Ensure public endpoint starts with /wp-json/
				$normalized_endpoint = '/wp-json/' . ltrim($public_endpoint, '/wp-json/');
				
				if (strpos($current_route, $normalized_endpoint) === 0) {
					return true; // Allow public access
				}
			}

			return new WP_Error('rest_forbidden', __('You are not authorized to access this resource.'), ['status' => 401]);
		}

		return $result;
}

    public function add_admin_menu() {
        add_options_page(
            'JWT API Access Manager', 
            'API Access Manager', 
            'manage_options', 
            'jwt-api-access-manager', 
            [$this, 'render_settings_page']
        );
    }

    public function init_settings() {
        register_setting('selective_auth_options', 'public_endpoints', [
            'type' => 'array',
            'sanitize_callback' => [$this, 'sanitize_endpoints'],
            'default' => []
        ]);
    }

    public function sanitize_endpoints($input) {
		// If input is empty or not set, return an empty array
		if (empty($input)) {
			return [];
		}

		// If input is a string, convert to array
		if (is_string($input)) {
			$input = explode(',', $input);
		}

		// Ensure we're working with an array
		if (!is_array($input)) {
			return [];
		}

		// Sanitize and normalize each endpoint
		$sanitized = array_map(function($endpoint) {
			// Trim whitespace
			$endpoint = trim($endpoint);
			
			// If endpoint is empty, skip it
			if (empty($endpoint)) {
				return null;
			}

			// Ensure the endpoint starts with /wp-json/
			$normalized = '/wp-json/' . ltrim($endpoint, '/wp-json/');
			
			return $normalized;
		}, $input);

		// Remove any null values and re-index
		$sanitized = array_values(array_filter($sanitized));

		return $sanitized;
	}

    public function enqueue_scripts($hook) {
        if ($hook !== 'settings_page_jwt-api-access-manager') {
            return;
        }
        wp_enqueue_script('jwt-api-access-manager', plugin_dir_url(__FILE__) . 'jwt-api-access-manager.js', ['jquery'], '1.5', true);
        wp_localize_script('jwt-api-access-manager', 'selectiveEndpointAuth', [
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('get_rest_endpoints_nonce'),
            'current_public_endpoints' => get_option('public_endpoints', [])
        ]);
        wp_enqueue_style('jwt-api-access-manager', plugin_dir_url(__FILE__) . 'jwt-api-access-manager.css');
    }

    public function get_rest_endpoints() {
        check_ajax_referer('get_rest_endpoints_nonce', 'nonce');

        $grouped_endpoints = [];
        $registered_routes = rest_get_server()->get_routes();

        foreach ($registered_routes as $route => $route_data) {
            if (strpos($route, '/__') === 0) continue;

            preg_match('/^\/(.+?\/[^\/]+)/', $route, $matches);
            $namespace = $matches[1] ?? 'other';

            if (!isset($grouped_endpoints[$namespace])) {
                $grouped_endpoints[$namespace] = [];
            }

            $grouped_endpoints[$namespace][] = [
                'route' => $route,
                'methods' => array_keys(array_filter($route_data, fn($data) => isset($data['callback'])))
            ];
        }

        wp_send_json_success($grouped_endpoints);
    }

    public function render_settings_page() {
        $current_public_endpoints = get_option('public_endpoints', []);
        ?>
        <div class="wrap">
            <h1>
				JWT API Access Manager
			</h1>
			
			<p style="margin: 0">
				This plugin allows you to manage and control the authentication settings for specific WordPress REST API endpoints.
				You can selectively make certain endpoints public or private, enhancing security and allowing more fine-grained control over the access to your site's data.
				Use this feature to enable authentication for sensitive endpoints and keep others open for public use.
			</p>


			<h3 style="margin: 0.5em 0">
				How to use:
			</h3>
			
			<ul style="margin: 0">
				<li>
					Use the search box to quickly locate the endpoints you're interested in.
				</li>
				
				<li>
					By default, all endpoints require authentication.
					You can mark specific endpoints as public by checking the respective boxes, which will make them accessible without authentication.
				</li>
				
				<li>
					Click "Save Changes" to apply your changes to the authentication settings.
				</li>
			</ul>

            <form id="selective-endpoint-form" method="post" action="options.php">
                <?php settings_fields('selective_auth_options'); ?>
				
                <div id="endpoint-list-container">
                   <div class="search-container">
						<input id="endpoint-search" type="text" placeholder="Search endpoints...">
						<a id="clear-search" type="button" style="display:none;">&times;</a>
					</div>

					
                    <div id="endpoint-list"></div>
                </div>
				
                <input type="hidden" name="public_endpoints" id="public-endpoints-input" value="<?php echo esc_attr(implode(',', $current_public_endpoints)); ?>">
				
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
new Selective_Endpoint_Authentication();
