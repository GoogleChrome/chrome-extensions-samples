/**
 * MediaRecorder instance for audio recording.
 * @type {MediaRecorder}
 */
let mediaRecorder;

/**
 * Event listener for messages from the extension.
 * @param {Object} request - The message request.
 * @param {Object} sender - The sender of the message.
 * @param {function} sendResponse - Callback function to send a response.
 * @returns {boolean} - Indicates whether the response should be asynchronous.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message.target !== 'offscreen') {
    return;
  }

  switch (request.message.type) {
    case 'START_OFFSCREEN_RECORDING':
      // Start recording
      handleRecording();
      sendResponse({});
      break;
    case 'STOP_OFFSCREEN_RECORDING':
      // Stop recording
      stopRecording();
      sendResponse({});
      break;
    case 'CHECK_PERMISSIONS':
      checkAudioPermissions()
        .then((data) => sendResponse(data))
        .catch((errorData) => sendResponse(errorData));
      break;
    default:
      break;
  }

  return true;
});

/**
 * Stops the recording if the MediaRecorder is in the recording state.
 */
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    console.log('Stopped recording in offscreen...');
    mediaRecorder.stop();
  }
}

/**
 * Initiates the audio recording process using MediaRecorder.
 */
async function handleRecording() {
  getAudioInputDevices().then((audioInputDevices) => {
    const deviceId = audioInputDevices[0].deviceId;
    navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: { exact: deviceId }
        }
      })
      .then((audioStream) => {
        try {
          mediaRecorder = new MediaRecorder(audioStream);
          mediaRecorder.ondataavailable = (event) => {
            if (mediaRecorder.state === 'recording') {
              saveAudioChunks([event.data]);
            }
          };
          mediaRecorder.onstop = handleStopRecording;

          // Start MediaRecorder and capture chunks every 10s.
          mediaRecorder.start(10000);

          console.log('Started recording in offscreen...');
        } catch (error) {
          console.error(
            'Unable to initiate MediaRecorder and/or streams',
            error
          );
        }
      });
  });
}

/**
 * Saves audio chunks captured by MediaRecorder.
 * @param {Blob[]} chunkData - Array of audio chunks in Blob format.
 */
function saveAudioChunks(chunkData) {
  console.log('Chunk captured from MediaRecorder');
  // Manage audio chunks accordingly as per your needs
}

/**
 * Event handler for when MediaRecorder is stopped.
 */
function handleStopRecording() {
  // Handle cases when MediaRecorder is stopped if needed
}

/**
 * Fetches audio input devices using the `navigator.mediaDevices.enumerateDevices` API.
 * @returns {Promise<Object[]>} - Promise that resolves to an array of audio input devices.
 */
function getAudioInputDevices() {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        // Filter the devices to include only audio input devices
        const audioInputDevices = devices.filter(
          (device) => device.kind === 'audioinput'
        );
        resolve(audioInputDevices);
      })
      .catch((error) => {
        console.log('Error getting audio input devices', error);
        reject(error);
      });
  });
}

/**
 * Checks microphone permissions using the `navigator.permissions.query` API.
 * @returns {Promise<Object>} - Promise that resolves to an object containing permission status.
 */
function checkAudioPermissions() {
  return new Promise((resolve, reject) => {
    navigator.permissions
      .query({ name: 'microphone' })
      .then((result) => {
        if (result.state === 'granted') {
          console.log('Mic permissions granted');
          resolve({ message: { status: 'success' } });
        } else {
          console.log('Mic permissions missing', result.state);
          reject({
            message: { status: 'error', data: result.state }
          });
        }
      })
      .catch((error) => {
        console.warn('Permissions error', error);
        reject({
          message: { status: 'error', data: { error: error } }
        });
      });
  });
}
