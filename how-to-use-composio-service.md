## How the hell to use composio service

1. **Install deps** (if you don’t already have them):

```bash
npm i composio-core           # the SDK
# Node ≥18 already has fetch; if you’re on ≤16 add: npm i node-fetch
```

2. **Drop the file** above into your project (e.g. `lib/composio-service.js`).

3. **Code sample** – bare-bones flow:

```js
const composio = require('./lib/composio-service');

(async () => {
  composio.initializeSDK(process.env.COMPOSIO_API_KEY);

  // sanity check
  await composio.verifyApiKey();
  console.log('Key OK');

  // 1. list apps
  const apps = await composio.listApps();
  console.log('Apps:', apps.map(a => a.name));

  // 2. pick one and connect
  const { connectedAccountId, redirectUrl, connectionStatus } =
    await composio.initiateConnection('slack');

  if (redirectUrl) {
    console.log('Open this in browser to complete OAuth:', redirectUrl);
    // after user finishes, poll:
    const details = await composio.getConnection(connectedAccountId);
    console.log('Status:', details.status);
  }

  // 3. once ACTIVE, create MCP server
  const v3Connections = await composio.getConnectedAccounts();
  const connection = v3Connections.find(c => c.id === connectedAccountId);
  const mcp = await composio.createMcpServer('my-slack-mcp', connection);
  console.log('MCP URL:', mcp.mcp_url || mcp.url);
})();
```

4. **Extra helper tricks**

| Need                                              | Call                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| List every action Composio exposes                | `await composio.listActions()`                                    |
| Only actions for a given app                      | `composio.filterActionsByApp(allActions, 'slack')`                |
| Submit API-key style creds after `PENDING_PARAMS` | `await composio.updateConnectionData(connId, { api_key: 'xyz' })` |
| Figure out what params you must provide           | `await composio.getRequiredParamsForAuthScheme(appId, 'api_key')` |

That’s it – one lightweight module, zero UI dependencies, 100 % ready to paste into any backend, CLI, Lambda, or wherever the fuck you need.
