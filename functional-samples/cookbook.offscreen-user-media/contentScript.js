/**
 * Listener for messages from the background script.
 * @param {Object} request - The message request.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - Callback function to send a response.
 * @returns {boolean} - Whether the response should be sent asynchronously (true by default).
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.message.type) {
    case 'PROMPT_MICROPHONE_PERMISSION':
      // Check for mic permissions. If not found, prompt
      checkMicPermissions()
        .then(() => {
          sendResponse({ message: { status: 'success' } });
        })
        .catch(() => {
          promptMicPermissions();
          const iframe = document.getElementById('PERMISSION_IFRAME_ID');
          window.addEventListener('message', (event) => {
            if (event.source === iframe.contentWindow && event.data) {
              if (event.data.type === 'permissionsGranted') {
                sendResponse({
                  message: { status: 'success' }
                });
              } else {
                sendResponse({
                  message: {
                    status: 'failure'
                  }
                });
              }
              document.body.removeChild(iframe);
            }
          });
        });
      break;

    default:
      // Do nothing for other message types
      break;
  }
  return true;
});

/**
 * Checks microphone permissions using a message to the background script.
 * @returns {Promise<void>} - Promise that resolves if permissions are granted, rejects otherwise.
 */
function checkMicPermissions() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        message: {
          type: 'CHECK_PERMISSIONS',
          target: 'offscreen'
        }
      },
      (response) => {
        if (response.message.status === 'success') {
          resolve();
        } else {
          reject(response.message.data);
        }
      }
    );
  });
}

/**
 * Prompts the user for microphone permissions using an iframe.
 */
function promptMicPermissions() {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('hidden', 'hidden');
  iframe.setAttribute('allow', 'microphone');
  iframe.setAttribute('id', 'PERMISSION_IFRAME_ID');
  iframe.src = chrome.runtime.getURL('requestPermissions.html');
  document.body.appendChild(iframe);
}
