# Flag-Style Arguments Fix for MCP Studio

This update improves how MCP Studio handles flag-style arguments (like `--flag value`) in NPX commands, making it work correctly for any service that uses this pattern, not just specific ones like Supabase.

## Problem

Previously, when importing or editing an MCP server configuration with flag-style arguments (arguments that start with `--` followed by a value), the application would incorrectly handle these arguments:

1. The flag (e.g., `--access-token`) would be separated from its value
2. When displayed in the UI, only the value would be shown, without the flag
3. When saving, the flag would be lost, breaking the command

## Solution

The fix modifies how NPX arguments are processed in the application:

1. When loading a configuration, flag-style arguments and their values are now properly paired together
2. In the UI, they are displayed as a single unit (e.g., `--access-token your-token`)
3. When saving, they are correctly split back into separate arguments in the array

This is a generic solution that works for any service that uses flag-style arguments, not just Supabase.

## Files Changed

1. `js/ui/server-form/form-fields.js`:
   - Modified `setupNpxForm` to properly handle flag-style arguments and their values
   - Updated `handleAdvancedSubmit` to ensure these flag-style arguments are properly saved

## Testing

A test file `test-flag-style-args.html` has been created with examples of different MCP server configurations that use flag-style arguments. You can use this file to verify that the fix works correctly for various scenarios:

1. Open the test file in a browser
2. Copy one of the example configurations
3. Import it into MCP Studio
4. Verify that the flag-style arguments are correctly displayed and saved

## Examples of Services That Benefit

This fix improves support for many MCP servers that use flag-style arguments, including:

- Supabase MCP Server (`--access-token`)
- GitHub MCP Server (`--token`)
- Custom MCP servers with configuration options (`--config-path`, `--output-format`, etc.)
- Any other service that uses the standard command-line pattern of `--flag value`

## Alternative Approach

For services that require sensitive tokens or keys, consider using environment variables instead of command-line arguments. This is often more secure and avoids potential issues with command-line argument parsing.

Example:
```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": [
        "-y",
        "my-package"
      ],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
