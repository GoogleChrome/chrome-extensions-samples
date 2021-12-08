
console.log('background script started.')

// called when the extension icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {

    // opens index.html on a new tab
    chrome.tabs.create({
        url: 'index.html'
      });
});