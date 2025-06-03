# MCP Bundles Requirements

## Overview
Bundles are curated collections of MCP tools from different marketplaces (Composio, Apify, Smithery) that work together for specific use cases. Users can install and configure entire workflows through a single interface.

## Functional Requirements

### 1. Bundle Data Structure
```json
{
  "bundles": [
    {
      "id": "research-assistant",
      "name": "Research Assistant Bundle",
      "description": "AI-powered research with web search and email integration",
      "icon": "🔍",
      "category": "productivity",
      "tools": [
        {
          "type": "smithery",
          "qualifiedName": "@tavily-ai/tavily-mcp",
          "displayName": "Tavily AI Search",
          "required": true
        },
        {
          "type": "composio",
          "app_key": "gmail",
          "displayName": "Gmail Integration",
          "required": true
        }
      ],
      "prompts": [
        {
          "name": "Research and Email Summary",
          "description": "Search for information and email a summary",
          "content": "Use Tavily to research [TOPIC] and then send a summary email via Gmail to [EMAIL]"
        }
      ]
    }
  ]
}
```

### 2. UI Requirements

#### 2.1 Sidebar Integration
- Add "📦 Bundles" section to sidebar
- Position between "Add Server" and "Marketplaces" sections
- Click opens dedicated bundles view

#### 2.2 Bundles Listing View
```
┌─────────── 📦 MCP Bundles ───────────────┐
│ [Search Bundles: ____________]           │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 🔍 Research Assistant Bundle         │ │
│ │ AI research + email integration      │ │
│ │ Tools: Tavily AI, Gmail              │ │
│ │ [📖 Docs] [⚙️ Configure]            │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ 📊 Analytics Bundle                  │ │
│ │ Data collection + visualization      │ │
│ │ Tools: Web Scraper, Charts API       │ │
│ │ [📖 Docs] [⚙️ Configure]            │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

#### 2.3 Bundle Configuration Modal
```
┌─────────── Configure Research Assistant Bundle ──────────┐
│ 🔍 Research Assistant Bundle                             │
│ Set up all tools and prompts for AI-powered research     │
├───────────────────────────────────────────────────────────┤
│ TOOLS:                                                   │
│ ✓ 🔍 Tavily AI Search (Smithery)     [✓ Installed]      │
│ ☐ 📧 Gmail Integration (Composio)    [Configure]        │
├───────────────────────────────────────────────────────────┤
│ PROMPTS:                                                 │
│ ☐ Research and Email Summary                             │
│ ☐ Quick Fact Check                                       │
├───────────────────────────────────────────────────────────┤
│ [Install Remaining] [Close]                              │
└───────────────────────────────────────────────────────────┘
```

### 3. Installation Workflow

#### 3.1 Individual Tool Configuration
- Click "Configure" button opens native marketplace modal
- Smithery tools → Smithery marketplace modal
- Composio apps → Composio marketplace modal  
- Apify actors → Apify marketplace modal
- User configures each tool manually (same as individual marketplace)

#### 3.2 "Install Remaining" Button
1. Identifies unconfigured tools in bundle
2. Opens marketplace modals sequentially
3. Waits for user to complete each configuration
4. Updates bundle status after each completion

#### 3.3 Status Detection Logic
```javascript
// Check if tool is installed by scanning MCP config
function isToolInstalled(tool) {
  const servers = getMCPServers();
  
  switch(tool.type) {
    case 'smithery':
      return servers.some(s => s.command?.includes(tool.qualifiedName));
    case 'composio':
      return servers.some(s => s.name?.toLowerCase().includes(tool.app_key));
    case 'apify':
      return servers.some(s => s.command?.includes(tool.actor_id));
  }
}
```

### 4. File Structure

#### 4.1 Data Files
- `bundles.json` - Bundle definitions
- Located in project root

#### 4.2 Code Structure
```
js/features/bundles/
├── index.js          # Main entry point
├── data.js           # Bundle data management
├── ui.js             # Bundle listing UI
├── modal.js          # Configuration modal
├── connector.js      # Integration with marketplaces
└── status.js         # Installation status detection
```

#### 4.3 CSS Structure
```
css/features/bundles/
├── base.css          # Base bundle styles
├── listing.css       # Bundle listing view
└── modal.css         # Configuration modal
```

### 5. Integration Requirements

#### 5.1 Marketplace Integration
- Reuse existing marketplace modal systems
- No duplication of configuration logic
- Leverage existing connectors (Smithery, Composio, Apify)

#### 5.2 Configuration Integration
- Monitor MCP config changes to update bundle status
- Integrate with existing config-manager.js
- Update bundle UI when servers are added/removed

#### 5.3 Navigation Integration
- Add bundle button to sidebar
- Integrate with existing view-manager.js
- Follow same patterns as marketplace navigation

### 6. Initial Bundle: Research Assistant

#### 6.1 Tools
1. **Tavily AI Search** (Smithery)
   - Qualified Name: `@tavily-ai/tavily-mcp`
   - Purpose: Web search and research
   - Required: Yes

2. **Gmail Integration** (Composio)
   - App Key: `gmail`
   - Purpose: Email sending and management
   - Required: Yes

#### 6.2 Prompts
1. **Research and Email Summary**
   - Use Tavily to research a topic
   - Compose and send summary via Gmail
   - Template: "Use Tavily to research [TOPIC] and then send a summary email via Gmail to [EMAIL]"

### 7. Future Enhancements

#### 7.1 Bundle Creation
- Allow users to create custom bundles
- Bundle sharing and export
- Community bundle marketplace

#### 7.2 Prompt Management
- Dedicated prompts library
- Prompt templates with variables
- Integration with AI clients

#### 7.3 Workflow Automation
- Bundle-specific automation scripts
- Trigger-based workflows
- Integration with external automation tools

## Technical Specifications

### 8. Bundle Data Schema
```typescript
interface Bundle {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tools: BundleTool[];
  prompts: BundlePrompt[];
}

interface BundleTool {
  type: 'smithery' | 'composio' | 'apify';
  qualifiedName?: string;  // For Smithery
  app_key?: string;        // For Composio
  actor_id?: string;       // For Apify
  displayName: string;
  required: boolean;
}

interface BundlePrompt {
  name: string;
  description: string;
  content: string;
}
```

### 9. Status Detection Patterns
- **Smithery**: Check for `qualifiedName` in server commands
- **Composio**: Check for `app_key` in server names (case-insensitive)
- **Apify**: Check for `actor_id` in server commands
- **Update Frequency**: Real-time when config changes, on bundle view open

### 10. Error Handling
- Handle missing marketplace data gracefully
- Show clear error messages for failed installations
- Provide fallback options when tools are unavailable
- Log bundle operations for debugging

## Implementation Priority

### Phase 1: Core Infrastructure
1. Create bundle data structure and JSON file
2. Add bundles section to sidebar
3. Create basic bundle listing view
4. Implement status detection logic

### Phase 2: Configuration System
1. Create bundle configuration modal
2. Integrate with existing marketplace modals
3. Implement "Install Remaining" workflow
4. Add real-time status updates

### Phase 3: Enhancement
1. Add search functionality
2. Implement prompt management
3. Add bundle documentation links
4. Create additional bundles

## Success Criteria
- Users can view available bundles in dedicated interface
- Bundle status accurately reflects installed tools
- Configuration opens appropriate marketplace modals
- Installation workflow is intuitive and reliable
- Bundle system integrates seamlessly with existing UI
