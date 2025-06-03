# Apify Marketplace Integration - Requirements & Implementation Proposal

## Requirements

### Functional Requirements
1. **Marketplace Integration**: Add Apify marketplace alongside existing Local and Composio marketplaces
2. **API Integration**: Fetch actors from Apify Store API using Bearer token authentication
3. **Single Server Model**: One MCP server entry (`apify-actors`) that gets modified, not multiple servers
4. **Actor Management**: Users can add/remove actors from the server configuration
5. **Visual Selection State**: Selected actors must be highlighted in the marketplace listing
6. **API Key Management**: Store Apify API key using same method as Composio marketplace
7. **No Categories**: Simple flat listing without category filtering

### Technical Requirements
1. **API Endpoint**: `https://api.apify.com/v2/store?limit=200`
2. **Authentication**: `Authorization: Bearer {api-key}` header
3. **Server Configuration**:
   ```json
   {
     "apify-actors": {
       "command": "npx",
       "args": ["-y", "@apify/actors-mcp-server", "--actors", "actor1,actor2,actor3"],
       "env": { "APIFY_TOKEN": "user-api-key" }
     }
   }
   ```
4. **Modular Architecture**: Keep files small and focused, split when necessary
5. **UI Consistency**: Follow existing marketplace patterns (Local/Composio)

## Implementation Proposal

### File Structure
```
js/features/apify-marketplace/
├── index.js          # Main entry point and initialization
├── data.js           # API calls to Apify Store API
├── modal.js          # Modal creation and lifecycle management
├── ui.js             # Main UI rendering and layout
├── items.js          # Actor item rendering and selection state
├── search.js         # Search and filtering functionality
├── details.js        # Actor detail view
├── connector.js      # Server configuration management
└── storage.js        # API key and cache management
```

### CSS Structure
```
css/features/apify-marketplace.css    # Main marketplace styles
```

### Core Components

#### 1. Data Layer (`data.js`)
- Fetch actors from Apify Store API
- Handle API authentication with Bearer token
- Cache actor data for performance
- Error handling for API failures
- Parse actor metadata (name, description, etc.)

#### 2. Storage Layer (`storage.js`)
- API key storage using same method as Composio
- Actor cache management
- Selected actors persistence
- IPC communication for data persistence

#### 3. UI Layer (`ui.js`, `items.js`)
- Render marketplace modal interface
- Display actor cards with metadata
- Highlight selected actors visually
- Handle user interactions (add/remove actors)
- Responsive design following existing patterns

#### 4. Search Layer (`search.js`)
- Real-time search functionality
- Filter actors by name/description
- No category filtering (flat listing)
- Search result highlighting

#### 5. Modal Management (`modal.js`)
- Modal creation and lifecycle
- API key input form
- Modal state management
- Integration with existing modal system

#### 6. Details View (`details.js`)
- Actor detail modal/panel
- Display comprehensive actor information
- Add/remove actions from detail view
- Link to Apify Store page

#### 7. Server Connector (`connector.js`)
- Manage single `apify-actors` server entry
- Add/remove actors from `--actors` parameter
- Update server configuration
- Handle comma-separated actor list
- Validate actor IDs

#### 8. Main Entry Point (`index.js`)
- Initialize marketplace
- Register event handlers
- Coordinate between components
- Export public API

### Integration Points

#### 1. Main Application Integration
- Add "Apify Actors" button to sidebar
- Register marketplace in main renderer
- Add IPC handlers in main.js
- Include CSS in main stylesheet

#### 2. Server Configuration Integration
- Modify config-manager.js if needed
- Ensure compatibility with existing server management
- Handle server restart when actors change

#### 3. UI Integration
- Follow existing modal patterns
- Use consistent styling with other marketplaces
- Integrate with notification system
- Maintain responsive design

### Key Implementation Details

#### Server Management Logic
```javascript
// Single server entry that gets modified:
{
  "apify-actors": {
    "command": "npx",
    "args": ["-y", "@apify/actors-mcp-server", "--actors", "lukaskrivka/google-maps-with-contact-details,apify/instagram-scraper"],
    "env": { "APIFY_TOKEN": "user-api-key" }
  }
}
```

#### Actor Selection State Management
- Track selected actors in memory during session
- Persist selected state to configuration
- Visual highlighting in UI for selected actors
- Efficient add/remove operations

#### API Integration Pattern
```javascript
// Example API call structure
const response = await fetch('https://api.apify.com/v2/store?limit=200', {
  headers: {
    'Authorization': `Bearer ${apiKey}`
  }
});
```

### Development Phases

#### Phase 1: Core Infrastructure
1. Create file structure
2. Implement data layer and API integration
3. Set up storage and IPC handlers
4. Basic modal and UI framework

#### Phase 2: UI Implementation
1. Actor listing and cards
2. Search functionality
3. Selection state management
4. Visual highlighting

#### Phase 3: Server Integration
1. Server configuration management
2. Actor add/remove functionality
3. Configuration persistence
4. Server restart handling

#### Phase 4: Polish and Integration
1. CSS styling and responsive design
2. Error handling and validation
3. Integration with main application
4. Testing and bug fixes

### Testing Considerations
- API key validation
- Actor selection/deselection
- Server configuration updates
- UI responsiveness
- Error handling scenarios
- Integration with existing features

### Security Considerations
- Secure API key storage
- Input validation for actor IDs
- Safe server configuration updates
- Protection against malicious actor data

This implementation will provide a seamless Apify marketplace experience that integrates naturally with the existing MCP Studio interface while maintaining the unique single-server model required by the Apify actors MCP server.
