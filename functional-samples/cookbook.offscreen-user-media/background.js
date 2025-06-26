/**
 * Path to the offscreen HTML document.
 * @type {string}
 */
const OFFSCREEN_DOCUMENT_PATH = 'offscreen/offscreen.html';

/**
 * Reason for creating the offscreen document.
 * @type {string}
 */
const OFFSCREEN_REASON = 'USER_MEDIA';

/**
 * Listener for extension installation.
 */
chrome.runtime.onInstalled.addListener(handleInstall);

/**
 * Listener for messages from the extension.
 * @param {Object} request - The message request.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - Callback function to send a response.
 */
chrome.runtime.onMessage.addListener((request) => {
  switch (request.message.type) {
    case 'TOGGLE_RECORDING':
      switch (request.message.data) {
        case 'START':
          initateRecordingStart();
          break;
        case 'STOP':
          initateRecordingStop();
          break;
      }
      break;
  }
});

/**
 * Handles the installation of the extension.
 */
async function handleInstall() {
  console.log('Extension installed...');
  if (!(await hasDocument())) {
    // create offscreen document
    await createOffscreenDocument();
  }
}

/**
 * Sends a message to the offscreen document.
 * @param {string} type - The type of the message.
 * @param {Object} data - The data to be sent with the message.
 */
async function sendMessageToOffscreenDocument(type, data) {
  // Create an offscreen document if one doesn't exist yet
  try {
    if (!(await hasDocument())) {
      await createOffscreenDocument();
    }
  } finally {
    // Now that we have an offscreen document, we can dispatch the message.
    chrome.runtime.sendMessage({
      message: {
        type: type,
        target: 'offscreen',
        data: data
      }
    });
  }
}

/**
 * Initiates the stop recording process.
 */
function initateRecordingStop() {
  console.log('Recording stopped at offscreen');
  sendMessageToOffscreenDocument('STOP_OFFSCREEN_RECORDING');
}

/**
 * Initiates the start recording process.
 */
function initateRecordingStart() {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, ([tab]) => {
    if (chrome.runtime.lastError || !tab) {
      console.error('No valid webpage or tab opened');
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      {
        // Send message to content script of the specific tab to check and/or prompt mic permissions
        message: { type: 'PROMPT_MICROPHONE_PERMISSION' }
      },
      (response) => {
        // If user allows the mic permissions, we continue the recording procedure.
        if (response.message.status === 'success') {
          console.log('Recording started at offscreen');
          sendMessageToOffscreenDocument('START_OFFSCREEN_RECORDING');
        }
      }
    );
  });
}

/**
 * Checks if there is an offscreen document.
 * @returns {Promise<boolean>} - Promise that resolves to a boolean indicating if an offscreen document exists.
 */
async function hasDocument() {
  // Check all windows controlled by the service worker if one of them is the offscreen document
  const matchedClients = await clients.matchAll();
  for (const client of matchedClients) {
    if (client.url.endsWith(OFFSCREEN_DOCUMENT_PATH)) {
      return true;
    }
  }
  return false;
}

/**
 * Creates the offscreen document.
 * @returns {Promise<void>} - Promise that resolves when the offscreen document is created.
 */
async function createOffscreenDocument() {
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_DOCUMENT_PATH,
    reasons: [OFFSCREEN_REASON],
    justification: 'To interact with user media'
  });
}
