/**
 * Server Form Utilities
 * Helper functions for the server form
 */

/**
 * Create a dynamic row with the provided HTML content
 * @param {HTMLElement} container - Container element
 * @param {string} html - Row HTML
 * @returns {HTMLElement} - The created row element
 */
export function makeRow(container, html) {
  const div = document.createElement('div');
  div.className = 'row';
  div.innerHTML = html;
  div.querySelector('button').onclick = () => div.remove();
  container.appendChild(div);
  return div;
}

/**
 * Add a generic argument row
 * @param {HTMLElement} container - Container element
 * @param {string} value - Argument value
 */
export function addGenericArg(container, value) {
  makeRow(container, `
    <input type="text" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Add a generic environment variable row
 * @param {HTMLElement} container - Container element
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 */
export function addGenericEnv(container, key, value) {
  makeRow(container, `
    <input class="env-key" type="text" placeholder="KEY" value="${key}">
    <input class="env-val" type="text" placeholder="VALUE" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Add an NPX argument row
 * @param {HTMLElement} container - Container element
 * @param {string} value - Argument value
 */
export function addNpxArg(container, value) {
  makeRow(container, `
    <input type="text" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Add an NPX environment variable row
 * @param {HTMLElement} container - Container element
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 */
export function addNpxEnv(container, key, value) {
  makeRow(container, `
    <input class="env-key" type="text" placeholder="KEY" value="${key}">
    <input class="env-val" type="text" placeholder="VALUE" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Add a Docker port row
 * @param {HTMLElement} container - Container element
 * @param {string} value - Port mapping
 */
export function addDockerPort(container, value) {
  makeRow(container, `
    <input type="text" placeholder="host:container" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Add a Docker volume row
 * @param {HTMLElement} container - Container element
 * @param {string} value - Volume mapping
 */
export function addDockerVolume(container, value) {
  makeRow(container, `
    <input type="text" placeholder="src:dst" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Add a Docker environment variable row
 * @param {HTMLElement} container - Container element
 * @param {string} key - Environment variable key
 * @param {string} value - Environment variable value
 */
export function addDockerEnv(container, key, value) {
  makeRow(container, `
    <input class="env-key" type="text" placeholder="KEY" value="${key}">
    <input class="env-val" type="text" placeholder="VALUE" value="${value}">
    <button class="btn btn-del">&times;</button>
  `);
}

/**
 * Get template description based on template ID
 * @param {string} templateId - Template ID
 * @returns {string} - Template description
 */
export function getTemplateDescription(templateId) {
  const descriptions = {
    'tavily-mcp': 'AI-powered search engine',
    'filesystem-server': 'Access files from specified directories',
    'apify-web-adapter': 'Scrape websites using Apify\'s actors',
    'composio-connection': 'Connect to third-party services via Composio',
    'composio-mcp': 'Create an MCP server from a Composio connection'
  };
  
  return descriptions[templateId] || 'Quick Add template';
}

/**
 * Extract environment variables from form rows
 * @param {HTMLElement} container - Container with env var rows
 * @returns {object} - Environment variables object
 */
export function extractEnvVars(container) {
  const env = {};
  container.querySelectorAll('.row').forEach(r => {
    const k = r.querySelector('.env-key').value.trim();
    const v = r.querySelector('.env-val').value.trim();
    if (k) env[k] = v;
  });
  return env;
}

/**
 * Extract arguments from form rows
 * @param {HTMLElement} container - Container with arg rows
 * @returns {string[]} - Array of arguments
 */
export function extractArgs(container) {
  return Array.from(container.querySelectorAll('input'))
    .map(i => i.value.trim())
    .filter(Boolean);
}
