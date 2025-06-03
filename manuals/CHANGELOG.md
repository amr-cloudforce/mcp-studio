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
