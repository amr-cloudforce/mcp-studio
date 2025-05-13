/**
 * URL Parser Module
 * Handles parsing and extracting MCP server configurations from various sources
 */

/**
 * Parse URL response and extract MCP server configuration
 * @param {string} url - The URL
 * @param {string} response - The response text
 * @returns {object|null} - The parsed configuration or null
 */
export function parseUrlResponse(url, response) {
  // Extract all possible JSON blocks from the response
  const jsonBlocks = extractJsonBlocks(response);
  
  // First, try to find NPX configurations specifically
  for (const jsonBlock of jsonBlocks) {
    // Check if this block contains an NPX configuration
    if (jsonBlock.includes('"command": "npx"') || 
        jsonBlock.includes('"command":"npx"')) {
      const config = parseJsonBlock(url, jsonBlock);
      if (config) {
        return config;
      }
    }
  }
  
  // If no NPX configurations found, try each JSON block normally
  // (but still filter out Docker configurations)
  for (const jsonBlock of jsonBlocks) {
    const config = parseJsonBlock(url, jsonBlock);
    if (config) {
      return config;
    }
  }
  
  return null;
}

/**
 * Parse a JSON block
 * @param {string} url - The URL
 * @param {string} jsonBlock - The JSON block to parse
 * @returns {object|null} - The parsed configuration or null
 */
function parseJsonBlock(url, jsonBlock) {
  try {
    const json = JSON.parse(jsonBlock);
    
    // Check if it's a valid MCP server configuration
    if (json.mcpServers) {
      // Get the first server
      const serverName = Object.keys(json.mcpServers)[0];
      if (serverName) {
        const config = json.mcpServers[serverName];
        
        // Only accept NPX configurations
        if (config.command === 'docker') {
          console.log('Skipping Docker configuration');
          return null;
        }
        
        return {
          name: serverName,
          config: config
        };
      }
    }
    
    // Check if it's a VSCode-style configuration (mcp.servers)
    if (json.mcp && json.mcp.servers) {
      // Get the first server
      const serverName = Object.keys(json.mcp.servers)[0];
      if (serverName) {
        const config = json.mcp.servers[serverName];
        
        // Only accept NPX configurations
        if (config.command === 'docker') {
          console.log('Skipping Docker configuration');
          return null;
        }
        
        return {
          name: serverName,
          config: config
        };
      }
    }
    
    // Check if it's a direct server configuration
    if (json.command && json.args) {
      // Only accept NPX configurations
      if (json.command === 'docker') {
        console.log('Skipping Docker configuration');
        return null;
      }
      
      return {
        name: generateNameFromUrl(url),
        config: json
      };
    }
  } catch (e) {
    // Ignore parsing errors for individual blocks
  }
  
  return null;
}

/**
 * Extract all possible JSON blocks from text
 * @param {string} text - The text to extract JSON blocks from
 * @returns {string[]} - Array of potential JSON blocks
 */
function extractJsonBlocks(text) {
  const blocks = [];
  
  // Try different extraction methods
  
  // 1. Extract code blocks with ```json (Markdown)
  extractMarkdownCodeBlocks(text, blocks);
  
  // 2. Extract <pre> or <code> blocks (HTML)
  extractHtmlCodeBlocks(text, blocks);
  
  // 3. Extract any JSON-like structures with braces
  extractJsonStructures(text, blocks);
  
  return blocks;
}

/**
 * Extract Markdown code blocks
 * @param {string} text - The text to extract from
 * @param {string[]} blocks - Array to add blocks to
 */
function extractMarkdownCodeBlocks(text, blocks) {
  // Match code blocks with ```json
  const codeBlockRegex = /```(?:json|JSON)\s*\n([\s\S]*?)\n```/g;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }
  
  // Also match code blocks with indentation (4 spaces or tab)
  const indentedBlockRegex = /(?:^|\n)(?:    |\t)({[\s\S]*?})/gm;
  
  while ((match = indentedBlockRegex.exec(text)) !== null) {
    if (match[1]) {
      // Remove the indentation
      const block = match[1].replace(/(?:^|\n)(?:    |\t)/g, '\n').trim();
      blocks.push(block);
    }
  }
}

/**
 * Extract HTML code blocks
 * @param {string} text - The text to extract from
 * @param {string[]} blocks - Array to add blocks to
 */
function extractHtmlCodeBlocks(text, blocks) {
  // Match <pre> blocks
  const preBlockRegex = /<pre(?:\s[^>]*)?>([\s\S]*?)<\/pre>/gi;
  let match;
  
  while ((match = preBlockRegex.exec(text)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }
  
  // Match <code> blocks
  const codeBlockRegex = /<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/gi;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }
}

/**
 * Extract JSON structures with braces
 * @param {string} text - The text to extract from
 * @param {string[]} blocks - Array to add blocks to
 */
function extractJsonStructures(text, blocks) {
  // Find all potential JSON objects (starting with { and ending with })
  // This is a simple approach and might not work for all cases
  const jsonRegex = /(\{[\s\S]*?\})/g;
  let match;
  
  while ((match = jsonRegex.exec(text)) !== null) {
    if (match[1]) {
      blocks.push(match[1].trim());
    }
  }
}

/**
 * Generate a name from a URL
 * @param {string} url - The URL
 * @returns {string} - The generated name
 */
function generateNameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    // GitHub repo
    if (urlObj.hostname === 'github.com' && pathParts.length >= 2) {
      return `${pathParts[0]}-${pathParts[1]}`;
    }
    
    // Gist
    if (urlObj.hostname === 'gist.github.com' && pathParts.length >= 1) {
      return `gist-${pathParts[0]}`;
    }
    
    // Default: use hostname
    return urlObj.hostname.replace(/\./g, '-');
  } catch (e) {
    // Fallback
    return 'imported-server';
  }
}
