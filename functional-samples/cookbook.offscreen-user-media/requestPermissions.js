/**
 * Requests user permission for microphone access and sends a message to the parent window.
 */
function getUserPermission() {
  console.info('Getting user permission for microphone access...');

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((response) => {
      if (response.id !== null && response.id !== undefined) {
        console.log('Microphone access granted');
        // Post a message to the parent window indicating successful permission
        window.parent.postMessage({ type: 'permissionsGranted' }, '*');
        return;
      }
      // Post a message to the parent window indicating failed permission
      window.parent.postMessage(
        {
          type: 'permissionsFailed'
        },
        '*'
      );
    })
    .catch((error) => {
      console.warn('Error requesting microphone permission: ', error);
      if (error.message === 'Permission denied') {
        // Show an alert if permission is denied
        window.alert(
          'Please allow microphone access. Highlight uses your microphone to record audio during meetings.'
        );
      }

      // Post a message to the parent window indicating failed permission with an optional error message
      window.parent.postMessage(
        {
          type: 'permissionsFailed',
          message: error.message
        },
        '*'
      );
    });
}

// Call the function to request microphone permission
getUserPermission();
