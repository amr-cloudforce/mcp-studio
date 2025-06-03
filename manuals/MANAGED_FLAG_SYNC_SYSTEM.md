# MANAGED FLAG SYNC SYSTEM

## Problem
Client configs get completely replaced, deleting external servers.

## Solution
Use `managed: true` flag to identify MCP Studio servers vs external servers.

## Implementation
1. **MCP Studio adds `managed: true`** to all servers when syncing to client configs
2. **Read client config** - find servers WITHOUT `managed: true` (external)
3. **Keep external servers** - preserve them untouched  
4. **Add MCP Studio servers** - with `managed: true` flag
5. **Combine both** - external + managed servers
6. **Replace client config** with combined result

## Result
- External servers: Protected (no `managed` flag)
- MCP Studio servers: Identified and updated (`managed: true`)
- No accidental deletions

## Files to Fix
- `claude-formatter.js` - fix selective merge
- `librechat-formatter.js` - fix selective merge
- `base-formatter.js` - add `managed: true` to exports
