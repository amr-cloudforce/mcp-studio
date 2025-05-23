/**
 * Marketplace Utilities
 * Shared utility functions for the marketplace
 */

/**
 * Format a repository name to be more human-readable
 * @param {string} repoName - The repository name
 * @returns {string} - The formatted name
 */
export function formatRepoName(repoName) {
  // Replace hyphens and underscores with spaces
  let formatted = repoName.replace(/[-_]/g, ' ');
  
  // Capitalize each word
  formatted = formatted.replace(/\b\w/g, c => c.toUpperCase());
  
  // Handle special cases like "MCP" that should be all caps
  formatted = formatted.replace(/\bMcp\b/g, 'MCP');
  
  return formatted;
}

/**
 * Convert markdown to HTML
 * @param {string} markdown - Markdown content
 * @returns {string} - HTML content
 */
export function markdownToHtml(markdown) {
  if (!markdown) return '';
  
  let html = markdown
    // Code blocks
    .replace(/```(\w*)([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a onclick="window.api.openUrl(\'$2\')" class="external-link" style="cursor:pointer">$1</a>')
    // Lists
    .replace(/^\s*\*\s(.*$)/gm, '<li>$1</li>')
    .replace(/^\s*-\s(.*$)/gm, '<li>$1</li>')
    .replace(/^\s*\d+\.\s(.*$)/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/^(?!<[a-z])/gm, '<p>')
    .replace(/^(?!<\/[a-z])/gm, '</p>');
  
  // Wrap lists
  html = html.replace(/<li>(.*?)<\/li>\s*<li>/g, '<li>$1</li><li>');
  html = html.replace(/<li>(.*?)<\/li>\s*(?!<li>)/g, '<ul><li>$1</li></ul>');
  
  return html;
}

/**
 * Truncate text to a specified length with a smart breakpoint
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 150) {
  if (!text || text.length <= maxLength) return text || '';
  
  // Find a good breaking point (end of sentence or space)
  let breakPoint = text.substring(0, maxLength).lastIndexOf('. ');
  if (breakPoint === -1 || breakPoint < maxLength * 0.6) {
    breakPoint = text.substring(0, maxLength).lastIndexOf(' ');
  }
  if (breakPoint === -1) breakPoint = maxLength;
  
  return text.substring(0, breakPoint) + '...';
}
