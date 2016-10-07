chrome.experimental.app.onLaunched.addListener(function() {
    chrome.app.window.create("index.html", {
        width: 700,
        height: 600
    });
});

chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.local.set({});
});

var windows = [];

var updateInterval;

function reset() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
    windows.forEach(function(w) {
        w.close();
    });
    windows.length = 0;
}

function minimizeAll() {
    windows.forEach(function(w) {
        w.chrome.app.window.minimize();
    });
    setTimeout(reset, 2e3);
}
