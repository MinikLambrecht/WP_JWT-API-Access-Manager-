# JWT API Access Manager

This plugin extends the **JWT Authentication for WP-API** plugin by allowing you to selectively control the authentication requirements for specific REST API endpoints. You can make certain endpoints public or private, adding fine-grained control over the access to your WordPress site's data.

## Features

- **Dynamic Authentication Control**: Selectively authenticate REST API endpoints based on your needs.
- **Admin Settings**: Manage the public and private endpoints from the WordPress admin panel.
- **Integration with JWT Authentication for WP-API**: Works seamlessly with the JWT Authentication plugin for enhanced security and flexibility.
- **Search Functionality**: Quickly find endpoints in the admin panel using the search box.
- **Easy to Use**: Simple UI to select which endpoints should be publicly accessible and which should require authentication.

## Installation

1. Install the [JWT Authentication for WP-API](https://github.com/Tmeister/wp-api-jwt-authentication) plugin if you haven't already.
2. Upload the `jwt-api-access-manager` folder to your WordPress plugin directory (`wp-content/plugins/`).
3. Activate the plugin through the WordPress admin panel (`Plugins > Installed Plugins`).
4. Go to `Settings > API Access Manager` to configure the public endpoints.

## Configuration

- The plugin adds a settings page under **Settings > API Access Manager** where you can configure which endpoints should be public.
- By default, all endpoints require authentication. You can mark specific endpoints as public, making them accessible without authentication.
- Use the search box to quickly locate the endpoints you're interested in.

### Public Endpoints

On the settings page, you can enter the endpoints that should be publicly accessible. These endpoints will not require JWT authentication for access. Simply uncheck the box next to the endpoint you wish to make public.

## How It Works

When a non-logged-in user attempts to access a restricted REST API endpoint, the plugin checks whether the endpoint is listed as public.
If the endpoint is public, access is granted without authentication. Otherwise, the user must provide a valid JWT token to authenticate.

## License

This plugin is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

## Credits

- **JWT Authentication for WP-API**: This plugin extends the functionality of the [JWT Authentication for WP-API plugin](https://github.com/Tmeister/wp-api-jwt-authentication).
- **Minik Lambrecht**: Plugin author and maintainer.

## Contributions

Contributions are welcome! Please feel free to fork the project, submit issues, and create pull requests.
