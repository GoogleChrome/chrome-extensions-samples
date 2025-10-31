# chrome.downloads

This sample demonstrates the `chrome.downloads` API for downloading files, monitoring download progress, and managing downloads.

## Overview

The extension provides a comprehensive interface to:

- **Download files** from URLs with custom filenames
- **Monitor downloads** in real-time with state updates
- **Search downloads** by filename or query
- **Manage downloads** with actions like pause, resume, cancel
- **Open or show files** after download completion
- **Remove downloads** from history or delete files

## Features

### Download Files
- Download from custom URLs
- Specify custom filenames
- Quick download buttons for common file types (PDF, Image, ZIP)

### Monitor Downloads
- View recent downloads with status (complete, in progress, interrupted)
- See file size, download time, and URL
- Real-time updates when downloads change state

### Download Management
- **Open**: Open completed downloads
- **Show in Folder**: Reveal file in system file manager
- **Pause/Resume**: Control in-progress downloads
- **Cancel**: Stop active downloads
- **Remove from History**: Clear download from Chrome's history
- **Delete File**: Remove the downloaded file from disk

### Search
- Search downloads by filename
- Filter by various criteria
- View search results with full download details

## API Usage Examples

### Download a file
```javascript
const downloadId = await chrome.downloads.download({
  url: 'https://example.com/file.pdf',
  filename: 'myfile.pdf'
});
```

### Search downloads
```javascript
const downloads = await chrome.downloads.search({
  query: 'report',
  orderBy: ['-startTime'],
  limit: 10
});
```

### Monitor download changes
```javascript
chrome.downloads.onChanged.addListener((downloadDelta) => {
  if (downloadDelta.state?.current === 'complete') {
    console.log('Download completed!');
  }
});
```

### Pause/Resume downloads
```javascript
await chrome.downloads.pause(downloadId);
await chrome.downloads.resume(downloadId);
```

### Open or show downloaded file
```javascript
await chrome.downloads.open(downloadId);
await chrome.downloads.show(downloadId);
```

## Permissions

This extension requires the following permissions:

- `downloads` - Core download functionality
- `downloads.open` - Open downloaded files
- `downloads.shelf` - Control download shelf visibility

## Running this extension

1. Clone this repository
2. Load this directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked)
3. Click the extension icon to open the popup
4. Try downloading files, monitoring progress, and managing downloads

## Implementation Notes

- Downloads are monitored via `chrome.downloads.onChanged` listener in the background script
- The popup provides a user-friendly interface for all download operations
- File sizes are formatted for readability
- Download states are color-coded for quick visual reference
- All operations include error handling with user feedback

## Learn More

- [chrome.downloads API Reference](https://developer.chrome.com/docs/extensions/reference/downloads/)
- [Download Files Guide](https://developer.chrome.com/docs/extensions/mv3/downloads/)
