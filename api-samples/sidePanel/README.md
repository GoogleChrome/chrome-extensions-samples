# chrome.sidePanel

This sample demonstrates the `chrome.sidePanel` API for creating persistent side panels in Chrome.

## Overview

The Side Panel API (introduced in Chrome 114) allows extensions to display content in a dedicated side panel alongside web pages. This extension showcases:

- **Global side panels** that persist across all tabs
- **Tab-specific panels** (can be configured per URL)
- **Persistent UI** that remains open during navigation
- **State management** with chrome.storage
- **Responsive design** adapting to panel width
- **Theme customization** with multiple color schemes

## Features

### Current Tab Information
- Display active tab title, URL, ID, and status
- Real-time updates when switching tabs

### Panel Width Tracking
- Shows current panel width (280px - 800px range)
- Demonstrates responsive design principles

### State Management
- Save and restore text state across sessions
- Persistent storage using chrome.storage.local

### Theme Customization
- Light, Dark, and Blue themes
- Smooth transitions between themes
- Theme preference saved across sessions

### Quick Actions
- Open new tabs
- Reload current tab
- Create bookmarks (demonstrates cross-API usage)

### Quick Notes
- Auto-saving notepad
- Persistent notes across browser sessions
- Clear notes functionality

### API Configuration
- Toggle between global and tab-specific behavior
- Display panel state and window information

## API Usage Examples

### Open side panel programmatically
```javascript
chrome.sidePanel.open({ windowId: tab.windowId });
```

### Set tab-specific side panel
```javascript
chrome.sidePanel.setOptions({
  tabId: tabId,
  path: 'custom-panel.html',
  enabled: true
});
```

### Get panel options
```javascript
const options = await chrome.sidePanel.getOptions({ tabId });
```

### Set panel behavior
```javascript
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
```

## Side Panel Guidelines

### Width Constraints
- Minimum width: 280px
- Maximum width: 800px
- Default width: ~400px
- Users can resize the panel

### Best Practices
1. **Design for variable widths** - Panel can be resized by users
2. **Use responsive layouts** - Adapt to different panel sizes
3. **Persist state** - Save user preferences and data
4. **Provide value** - Panels should enhance browsing experience
5. **Be lightweight** - Panels run continuously, optimize performance

### Use Cases
- **Reading lists** - Save and organize articles
- **Bookmarks manager** - Quick access to saved pages
- **Translation tools** - Translate page content
- **Notes and annotations** - Take notes while browsing
- **Developer tools** - Custom debugging interfaces
- **AI assistants** - Chat interfaces for AI help
- **Dictionary/Reference** - Look up terms while reading

## Permissions

This extension requires:

- `sidePanel` - Core side panel functionality
- `activeTab` - Access current tab information
- `tabs` - Query and manipulate tabs
- `storage` - Persist user data and preferences

## Running this extension

1. Clone this repository
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
3. Click the extension icon to open the side panel
4. Explore the features and try different themes

## Implementation Notes

- Side panel opens when extension icon is clicked (via `chrome.action.onClicked`)
- Panel content is defined in `sidepanel.html`
- Background script handles tab updates and messages
- State is persisted using `chrome.storage.local`
- Themes are applied via CSS custom properties
- Panel width is tracked using `window.innerWidth`

## Browser Compatibility

- **Chrome 114+** - Side Panel API introduced
- **Edge 114+** - Supported in Chromium-based Edge

## Learn More

- [chrome.sidePanel API Reference](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [Side Panel Design Guidelines](https://developer.chrome.com/docs/extensions/mv3/user_interface/#sidepanel)
- [Side Panel Examples](https://github.com/GoogleChrome/chrome-extensions-samples/tree/main/functional-samples/sample.sidepanel-site-specific)
