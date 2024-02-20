const TEN_SECONDS_MS = 10 * 1000;
let webSocket = null;

// Make sure the Glitch demo server is running
fetch('https://chrome-extension-websockets.glitch.me/', { mode: 'no-cors' });

// Toggle WebSocket connection on action button click
// Send a message every 10 seconds, the ServiceWorker will
// be kept alive as long as messages are being sent.
chrome.action.onClicked.addListener(async () => {
  if (webSocket) {
    disconnect();
  } else {
    connect();
    keepAlive();
  }
});

function connect() {
  webSocket = new WebSocket('wss://chrome-extension-websockets.glitch.me/ws');

  webSocket.onopen = () => {
    chrome.action.setIcon({ path: 'icons/socket-active.png' });
  };

  webSocket.onmessage = (event) => {
    console.log(event.data);
  };

  webSocket.onclose = () => {
    chrome.action.setIcon({ path: 'icons/socket-inactive.png' });
    console.log('websocket connection closed');
    webSocket = null;
  };
}

function disconnect() {
  if (webSocket) {
    webSocket.close();
  }
}

function keepAlive() {
  const keepAliveIntervalId = setInterval(
    () => {
      if (webSocket) {
        console.log('ping');
        webSocket.send('ping');
      } else {
        clearInterval(keepAliveIntervalId);
      }
    },
    // It's important to pick an interval that's shorter than 30s, to
    // avoid that the service worker becomes inactive.
    TEN_SECONDS_MS
  );
}
