/**
 * Composio Template Handler
 * Handles form generation and submission for the Composio template
 */

import * as ui from './composio-ui.js';
import * as connection from './composio-connection.js';

/**
 * Generate form for Composio template
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateForm(config) {
  // Generate the form HTML
  const formHtml = ui.generateFormHtml(config);
  
  // Extract API key and app name from config
  const apiKey = config.env && config.env.COMPOSIO_API_KEY ? config.env.COMPOSIO_API_KEY : '';
  const appName = config.metadata && config.metadata.composioApp ? config.metadata.composioApp : '';
  
  // Set up event handlers after a short delay to ensure DOM is ready
  setTimeout(() => {
    ui.setupEventHandlers(apiKey, appName);
  }, 100);
  
  return formHtml;
}

/**
 * Handle Composio form submission
 * @param {object} config - Server configuration object to be modified
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  // Get form values
  const { apiKey, appName } = ui.getFormValues();
  
  // Validate inputs
  if (!apiKey) {
    alert('Composio API Key is required');
    return null;
  }
  
  if (!appName) {
    alert('Please select a Composio app');
    return null;
  }
  
  // Set command and args
  config.command = 'node';
  
  // Set args - create a script that uses composio-service.js
  config.args = [
    '-e',
    `
    const composio = require('./composio-service.js');
    
    (async () => {
      try {
        // Initialize SDK
        composio.initializeSDK(process.env.COMPOSIO_API_KEY);
        console.log('Composio SDK initialized');
        
        // Verify API key
        await composio.verifyApiKey();
        console.log('API key verified');
        
        // Initiate connection
        const { connectedAccountId, redirectUrl, connectionStatus } = 
          await composio.initiateConnection('${appName}');
        
        if (redirectUrl) {
          console.log('Please open this URL in your browser to complete the OAuth flow:');
          console.log(redirectUrl);
          
          // Poll for connection status
          console.log('Waiting for OAuth flow to complete...');
          let status = connectionStatus;
          let connection = null;
          
          while (status !== 'ACTIVE') {
            // Wait 5 seconds between polls
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Get updated connection status
            connection = await composio.getConnection(connectedAccountId);
            status = connection.status;
            
            console.log('Connection status:', status);
            
            if (status === 'PENDING_PARAMS') {
              console.log('Additional parameters required. Please update the connection data manually.');
              break;
            }
            
            if (status === 'ERROR') {
              console.error('Connection error:', connection.error || 'Unknown error');
              break;
            }
          }
          
          if (status === 'ACTIVE') {
            // Create MCP server
            const v3Connections = await composio.getConnectedAccounts();
            const connection = v3Connections.find(c => c.id === connectedAccountId);
            
            if (connection) {
              const mcp = await composio.createMcpServer('${appName}-mcp', connection);
              console.log('MCP server created successfully!');
              console.log('MCP URL:', mcp.mcp_url || mcp.url);
            } else {
              console.error('Connection not found in V3 API');
            }
          }
        } else if (connectionStatus === 'ACTIVE') {
          console.log('Connection is already active');
          
          // Create MCP server
          const v3Connections = await composio.getConnectedAccounts();
          const connection = v3Connections.find(c => c.id === connectedAccountId);
          
          if (connection) {
            const mcp = await composio.createMcpServer('${appName}-mcp', connection);
            console.log('MCP server created successfully!');
            console.log('MCP URL:', mcp.mcp_url || mcp.url);
          } else {
            console.error('Connection not found in V3 API');
          }
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    })();
    `
  ];
  
  // Set environment variables
  config.env = {
    COMPOSIO_API_KEY: apiKey
  };
  
  // Set disabled flag
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  // Store template ID and app name in metadata
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'composio-mcp',
      templateName: 'Composio Integration',
      composioApp: appName
    };
  } else {
    config.metadata.quickAddTemplate = 'composio-mcp';
    config.metadata.templateName = 'Composio Integration';
    config.metadata.composioApp = appName;
  }
  
  return config;
}
