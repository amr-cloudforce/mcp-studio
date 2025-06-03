# CHANGELOG

All notable changes to this project will be documented in this file.

## Managed Flag Sync System
- Added `managed: true` flag to client configs to identify MCP Studio servers
- Fixed selective merge logic to preserve external servers without managed flag
- Updated base-formatter.js to add managed flag during export
- Fixed claude-formatter.js condition from `!serverConfig.managed` to `serverConfig.managed !== true`
- Fixed librechat-formatter.js condition in both YAML and JSON fallback sections
- Removed managed flag from MCP Studio internal config (only needed in client configs)
- Created documentation in manuals/MANAGED_FLAG_SYNC_SYSTEM.md

## Composio OAuth Filtering
- Filter Composio marketplace to show only OAuth-supported apps
- Check both `auth_schemes` and `composio_managed_auth_schemes` contain "OAUTH2"
- Hide apps that only support API keys or other non-OAuth auth methods

## Restart Command Validation Fix
- Fixed bug where restart command validation failed even with valid input
- Added debug logging to identify validation issues
- Added fallback to read from input field if stored command is invalid
- Fixed variable reference bug using `finalCommand` instead of `restartCommand`

## Restart All Clients Button
- Changed "Restart Claude" button to "Restart Clients" 
- Updated functionality to restart all clients with valid restart commands
- Added support for restarting multiple clients simultaneously
- Shows summary of restart results for all clients

## Documentation Links in Marketplaces
- Added documentation links at top of each marketplace item
- Added documentation links in details/modal views for all marketplaces
- Consistent design with 📖 icon across all marketplaces
- Links open in external browser, not in-app
- URL patterns: Smithery (smithery.ai), Composio (mcp.composio.dev), Apify (apify.com)
- Available in both listing view and details view

## Restart All Clients Button
- Added "Restart All Clients" button to main MCP Servers view
- Restarts all configured MCP clients (Claude, LibreChat, etc.)
- Uses existing restart clients functionality
- Positioned in header of servers table view

## Documentation Links in Details Views
- Added documentation links to all marketplace details/modal views
- Consistent with listing view design using 📖 icon
- Links open in external browser from details modals
- Available in Composio, Apify, and Smithery details views

## Fixed Directory Selection Bug
- Fixed "Cannot read properties of undefined (reading 'selectDirectory')" error
- Updated preload.js to properly expose window.api object
- Added all required IPC methods: selectDirectory, openUrl, fetchUrl, etc.
- Browse buttons in Quick Add and server forms now work correctly
