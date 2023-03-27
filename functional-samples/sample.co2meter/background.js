console.log('Extension service worker background script (background.js)');

if (navigator.hid) {
  console.log('WebHID is available');
} else {
  console.log('WebHID not available');
}

