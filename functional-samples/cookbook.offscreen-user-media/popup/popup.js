document.addEventListener('DOMContentLoaded', function () {
  const startButton = document.getElementById('start-button');
  const stopButton = document.getElementById('stop-button');

  // Function to send a message to the background script
  const sendMessageToBackground = (message) => {
    chrome.runtime.sendMessage({
      message: {
        type: 'TOGGLE_RECORDING',
        target: 'background',
        data: message
      }
    });
  };

  // Add a click event listener to the start button
  startButton.addEventListener('click', function () {
    sendMessageToBackground('START');
  });

  // Add a click event listener to the stop button
  stopButton.addEventListener('click', function () {
    sendMessageToBackground('STOP');
  });
});
