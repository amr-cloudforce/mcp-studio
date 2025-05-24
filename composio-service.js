/* composio-service.js
 * Lightweight, headless wrapper around the Composio SDK + REST V3 endpoints.
 * Works in any Node ≥18 (global fetch) or browser/Edge-runtime that supports fetch.
 */

const { ComposioToolSet } = require('composio-core');

// single shared SDK instance (lazy-re-initialisable)
let _toolset = null;

/**
 * Boot the SDK once per API key.
 * Call this first – every other helper throws if you forget.
 * @param {string} apiKey e.g. "sk_live_xxx"
 * @returns {ComposioToolSet}
 */
function initializeSDK(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('initializeSDK: apiKey (string) required');
  }
  _toolset = new ComposioToolSet({ apiKey });
  return _toolset;
}

const getToolset = () => _toolset;

/* -------------------------------------------------- */
/* -----------------  V3  HELPERS  ------------------ */
/* -------------------------------------------------- */

async function getConnectedAccounts() {
  _guard();
  const res = await fetch(
    'https://backend.composio.dev/api/v3/connected_accounts',
    { headers: { 'x-api-key': _toolset.apiKey } }
  );
  if (!res.ok) throw _httpErr('get connected accounts', res);
  const { items = [] } = await res.json();
  return items;
}

async function getConnectedAccountsByApp(toolkitSlug) {
  _guard();
  if (!toolkitSlug) throw new Error('getConnectedAccountsByApp: toolkitSlug required');
  const allConnections = await getConnectedAccounts();
  return allConnections.filter(conn => 
    conn.toolkit?.slug === toolkitSlug
  );
}

async function deleteConnectedAccount(connectionId) {
  _guard();
  if (!connectionId) throw new Error('deleteConnectedAccount: connectionId required');
  
  console.log(`🗑️ Deleting connected account: ${connectionId}`);
  
  const res = await fetch(
    `https://backend.composio.dev/api/v3/connected_accounts/${connectionId}`,
    { 
      method: 'DELETE',
      headers: { 'x-api-key': _toolset.apiKey } 
    }
  );
  if (!res.ok) throw _httpErr('delete connected account', res);
  
  console.log(`✅ Successfully deleted connected account: ${connectionId}`);
  
  return res.json();
}

async function deleteAuthConfig(authConfigId) {
  _guard();
  if (!authConfigId) throw new Error('deleteAuthConfig: authConfigId required');
  
  console.log(`🗑️ Deleting auth config: ${authConfigId}`);
  
  const res = await fetch(
    `https://backend.composio.dev/api/v3/auth_configs/${authConfigId}`,
    { 
      method: 'DELETE',
      headers: { 'x-api-key': _toolset.apiKey } 
    }
  );
  if (!res.ok) throw _httpErr('delete auth config', res);
  
  console.log(`✅ Successfully deleted auth config: ${authConfigId}`);
  
  return res.json();
}

async function deleteAllConnectionsForApp(toolkitSlug) {
  _guard();
  if (!toolkitSlug) throw new Error('deleteAllConnectionsForApp: toolkitSlug required');
  
  console.log(`🚀 Starting deletion process for app: ${toolkitSlug}`);
  
  const connections = await getConnectedAccountsByApp(toolkitSlug);
  console.log(`📋 Found ${connections.length} connected accounts for ${toolkitSlug}`);
  
  // Extract auth_config IDs from connections
  const authConfigIds = connections.map(conn => conn.auth_config?.id).filter(Boolean);
  console.log(`📋 Found ${authConfigIds.length} auth configs to delete`);
  
  // Log connection details
  connections.forEach(conn => {
    console.log(`📝 Connection: ${conn.id} -> Auth Config: ${conn.auth_config?.id || 'none'}`);
  });
  
  // Delete connected accounts first
  console.log(`🗑️ Deleting ${connections.length} connected accounts...`);
  const deleteConnectionPromises = connections.map(conn => 
    deleteConnectedAccount(conn.id)
  );
  await Promise.all(deleteConnectionPromises);
  console.log(`✅ Completed deleting ${connections.length} connected accounts`);
  
  // Delete related auth configs
  console.log(`🗑️ Deleting ${authConfigIds.length} auth configs...`);
  const deleteAuthConfigPromises = authConfigIds.map(id => 
    deleteAuthConfig(id)
  );
  await Promise.all(deleteAuthConfigPromises);
  console.log(`✅ Completed deleting ${authConfigIds.length} auth configs`);
  
  const result = { deletedConnections: connections.length, deletedAuthConfigs: authConfigIds.length };
  console.log(`🎉 Deletion complete for ${toolkitSlug}:`, result);
  
  return result;
}

async function createAuthConfig(toolkitSlug) {
  _guard();
  if (!toolkitSlug) throw new Error('createAuthConfig: toolkitSlug required');
  const res = await fetch(
    'https://backend.composio.dev/api/v3/auth_configs',
    {
      method: 'POST',
      headers: {
        'x-api-key': _toolset.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ toolkit: { slug: toolkitSlug } })
    }
  );
  if (!res.ok) throw _httpErr('create auth config', res);
  return res.json();
}

async function createMcpServer(name, connection, allowedTools = []) {
  _guard();
  if (!name) throw new Error('createMcpServer: name required');
  if (!connection?.auth_config?.id) {
    throw new Error('createMcpServer: connection missing auth_config.id');
  }

  const payload = {
    name,
    auth_config_id: connection.auth_config.id,
    ...(allowedTools.length && { allowed_tools: allowedTools })
  };

  const res = await fetch('https://backend.composio.dev/api/v3/mcp/servers', {
    method: 'POST',
    headers: {
      'x-api-key': _toolset.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw _httpErr('create MCP server', res);
  return res.json();
}

async function listTools(options = {}) {
  _guard();
  const { limit = 100, cursor, search, important, tags, toolkit_slug } = options;
  
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (cursor) params.append('cursor', cursor);
  if (search) params.append('search', search);
  if (important) params.append('important', important.toString());
  if (tags && Array.isArray(tags)) {
    tags.forEach(tag => params.append('tags', tag));
  }
  if (toolkit_slug) params.append('toolkit_slug', toolkit_slug);
  
  const url = `https://backend.composio.dev/api/v3/tools${params.toString() ? '?' + params.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: { 'x-api-key': _toolset.apiKey }
  });
  
  if (!res.ok) throw _httpErr('list tools', res);
  const data = await res.json();
  return data.items || [];
}

async function listToolkits(options = {}) {
  _guard();
  const { limit = 100, cursor, category, managed_by, is_local, sort_by } = options;
  
  const params = new URLSearchParams();
  if (limit) params.append('limit', limit.toString());
  if (cursor) params.append('cursor', cursor);
  if (category) params.append('category', category);
  if (managed_by) params.append('managed_by', managed_by);
  if (is_local !== undefined) params.append('is_local', is_local.toString());
  if (sort_by) params.append('sort_by', sort_by);
  
  const url = `https://backend.composio.dev/api/v3/toolkits${params.toString() ? '?' + params.toString() : ''}`;
  
  const res = await fetch(url, {
    headers: { 'x-api-key': _toolset.apiKey }
  });
  
  if (!res.ok) throw _httpErr('list toolkits', res);
  const data = await res.json();
  return data.items || [];
}

/* -------------------------------------------------- */
/* -----------------  V1  HELPERS  ------------------ */
/* -------------------------------------------------- */

async function listApps() {
  _guard();
  const out = await _toolset.client.apps.list();
  return _normalizeArrayResponse(out);
}

async function listActions() {
  _guard();
  const out = await _toolset.client.actions.list();
  return _normalizeArrayResponse(out);
}

function filterActionsByApp(actions, appKey) {
  return (actions || []).filter(
    (a) => a.app === appKey || a.appName === appKey || a.appUniqueKey === appKey
  );
}

async function initiateConnection(appName, entityId = 'default') {
  _guard();
  if (!appName) throw new Error('initiateConnection: appName required');

  // try to create auth_config up front (optional but nicer UX)
  let authConfig;
  try {
    authConfig = await createAuthConfig(appName);
  } catch (e) {
    // non-fatal – carry on with V1 flow
    console.warn('initiateConnection: createAuthConfig failed ->', e.message);
  }

  const payload = { appName, entityId };
  const resp = await _toolset.client.connectedAccounts.initiate(payload);
  if (authConfig?.auth_config) resp.auth_config = authConfig.auth_config;
  return resp;
}

async function getConnection(connectedAccountId) {
  _guard();
  return _toolset.client.connectedAccounts.get({ connectedAccountId });
}

async function updateConnectionData(connectedAccountId, data) {
  _guard();
  return _toolset.client.connectedAccounts._updateConnectionData({
    connectedAccountId,
    data
  });
}

async function getRequiredParamsForAuthScheme(appId, authScheme) {
  _guard();
  return _toolset.client.apps.getRequiredParamsForAuthScheme({
    appId,
    authScheme
  });
}

/* -------------------------------------------------- */
/* -----------------  UTILITIES  -------------------- */
/* -------------------------------------------------- */

function verifyApiKey() {
  // simple truthy fetch to prove the key works
  return getConnectedAccounts().then((items) => ({ items }));
}

function _guard() {
  if (!_toolset) throw new Error('SDK not initialized – call initializeSDK()');
}

function _httpErr(action, res) {
  return new Error(
    `Failed to ${action}: ${res.status} ${res.statusText || ''}`.trim()
  );
}

// Composio sometimes wraps arrays ↔ objects; make it predictable.
function _normalizeArrayResponse(res) {
  if (Array.isArray(res)) return res;
  if (res?.items) return res.items;
  if (res?.data) return res.data;
  return res ? [res] : [];
}

/* -------------------------------------------------- */
/* -----------------  EXPORTS  ---------------------- */
/* -------------------------------------------------- */

module.exports = {
  // boot / state
  initializeSDK,
  getToolset,

  // sanity check
  verifyApiKey,

  // V3
  getConnectedAccounts,
  getConnectedAccountsByApp,
  deleteConnectedAccount,
  deleteAuthConfig,
  deleteAllConnectionsForApp,
  createAuthConfig,
  createMcpServer,
  listTools,
  listToolkits,

  // V1 wrappers
  listApps,
  listActions,
  filterActionsByApp,
  initiateConnection,
  getConnection,
  updateConnectionData,
  getRequiredParamsForAuthScheme
};
