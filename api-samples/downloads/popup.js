// Copyright 2024 Google LLC
//
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file or at
// https://developers.google.com/open-source/licenses/bsd

// DOM elements
const urlInput = document.getElementById('url');
const filenameInput = document.getElementById('filename');
const downloadBtn = document.getElementById('download-btn');
const refreshBtn = document.getElementById('refresh-btn');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const downloadsContainer = document.getElementById('downloads-container');
const searchQuery = document.getElementById('search-query');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const statusDiv = document.getElementById('status');
const quickDownloadBtns = document.querySelectorAll('.quick-downloads .btn');

// Event listeners
downloadBtn.addEventListener('click', handleDownload);
refreshBtn.addEventListener('click', loadRecentDownloads);
clearHistoryBtn.addEventListener('click', clearDownloadHistory);
searchBtn.addEventListener('click', handleSearch);

quickDownloadBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const url = e.target.dataset.url;
    const filename = e.target.dataset.name;
    downloadFile(url, filename);
  });
});

// Download a file
async function handleDownload() {
  const url = urlInput.value.trim();
  const filename = filenameInput.value.trim();

  if (!url) {
    showStatus('Please enter a URL', 'error');
    return;
  }

  downloadFile(url, filename);
}

async function downloadFile(url, filename) {
  try {
    const options = { url };
    if (filename) {
      options.filename = filename;
    }

    const downloadId = await chrome.downloads.download(options);
    showStatus(`Download started (ID: ${downloadId})`, 'success');
    
    // Refresh the downloads list after a short delay
    setTimeout(loadRecentDownloads, 500);
  } catch (error) {
    showStatus(`Download failed: ${error.message}`, 'error');
  }
}

// Load recent downloads
async function loadRecentDownloads() {
  try {
    const downloads = await chrome.downloads.search({
      orderBy: ['-startTime'],
      limit: 10
    });

    displayDownloads(downloads, downloadsContainer);
  } catch (error) {
    showStatus(`Failed to load downloads: ${error.message}`, 'error');
  }
}

// Search downloads
async function handleSearch() {
  const query = searchQuery.value.trim();
  
  try {
    const downloads = await chrome.downloads.search({
      query: query,
      orderBy: ['-startTime']
    });

    displayDownloads(downloads, searchResults);
    showStatus(`Found ${downloads.length} download(s)`, 'success');
  } catch (error) {
    showStatus(`Search failed: ${error.message}`, 'error');
  }
}

// Display downloads in a container
function displayDownloads(downloads, container) {
  if (downloads.length === 0) {
    container.innerHTML = '<p style="color: #5f6368; font-size: 13px;">No downloads found</p>';
    return;
  }

  container.innerHTML = downloads.map(download => {
    const filename = download.filename.split(/[\\/]/).pop();
    const filesize = download.fileSize ? formatBytes(download.fileSize) : 'Unknown size';
    const startTime = new Date(download.startTime).toLocaleString();
    const state = download.state;
    
    return `
      <div class="download-item">
        <div class="filename">${escapeHtml(filename)}</div>
        <div class="details">
          <span class="state state-${state}">${state.toUpperCase()}</span>
          ${filesize} • ${startTime}
        </div>
        ${download.url ? `<div class="details" style="font-size: 11px; color: #80868b;">URL: ${escapeHtml(download.url)}</div>` : ''}
        <div class="actions">
          ${state === 'complete' ? `
            <button class="btn btn-action" data-id="${download.id}" data-action="open">Open</button>
            <button class="btn btn-action" data-id="${download.id}" data-action="show">Show in Folder</button>
          ` : ''}
          ${state === 'in_progress' ? `
            <button class="btn btn-secondary" data-id="${download.id}" data-action="pause">Pause</button>
            <button class="btn btn-danger" data-id="${download.id}" data-action="cancel">Cancel</button>
          ` : ''}
          ${state === 'interrupted' ? `
            <button class="btn btn-action" data-id="${download.id}" data-action="resume">Resume</button>
          ` : ''}
          <button class="btn btn-danger" data-id="${download.id}" data-action="remove">Remove from History</button>
          ${state === 'complete' ? `
            <button class="btn btn-danger" data-id="${download.id}" data-action="erase">Delete File</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners to action buttons
  container.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', handleDownloadAction);
  });
}

// Handle download actions
async function handleDownloadAction(e) {
  const downloadId = parseInt(e.target.dataset.id);
  const action = e.target.dataset.action;

  try {
    switch (action) {
      case 'open':
        await chrome.downloads.open(downloadId);
        showStatus('Opening file...', 'success');
        break;
      
      case 'show':
        await chrome.downloads.show(downloadId);
        showStatus('Showing file in folder...', 'success');
        break;
      
      case 'pause':
        await chrome.downloads.pause(downloadId);
        showStatus('Download paused', 'success');
        setTimeout(loadRecentDownloads, 300);
        break;
      
      case 'resume':
        await chrome.downloads.resume(downloadId);
        showStatus('Download resumed', 'success');
        setTimeout(loadRecentDownloads, 300);
        break;
      
      case 'cancel':
        await chrome.downloads.cancel(downloadId);
        showStatus('Download cancelled', 'success');
        setTimeout(loadRecentDownloads, 300);
        break;
      
      case 'remove':
        await chrome.downloads.erase({ id: downloadId });
        showStatus('Removed from history', 'success');
        setTimeout(loadRecentDownloads, 300);
        break;
      
      case 'erase':
        await chrome.downloads.removeFile(downloadId);
        showStatus('File deleted', 'success');
        setTimeout(loadRecentDownloads, 300);
        break;
    }
  } catch (error) {
    showStatus(`Action failed: ${error.message}`, 'error');
  }
}

// Clear download history
async function clearDownloadHistory() {
  if (!confirm('Are you sure you want to clear all download history?')) {
    return;
  }

  try {
    const downloads = await chrome.downloads.search({});
    await chrome.downloads.erase({});
    showStatus(`Cleared ${downloads.length} download(s) from history`, 'success');
    loadRecentDownloads();
  } catch (error) {
    showStatus(`Failed to clear history: ${error.message}`, 'error');
  }
}

// Utility functions
function showStatus(message, type = 'success') {
  statusDiv.textContent = message;
  statusDiv.className = `status show ${type}`;
  
  setTimeout(() => {
    statusDiv.classList.remove('show');
  }, 3000);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load downloads on popup open
loadRecentDownloads();
