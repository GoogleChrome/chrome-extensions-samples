let currentStream = null;

function printErrorMessage(message) {
  const element = document.getElementById('echo-msg');
  element.innerText = message;
  console.error(message);
}

// Stop video play-out and stop the MediaStreamTracks.
function shutdownReceiver() {
  if (!currentStream) {
    return;
  }

  const player = document.getElementById('player');
  player.srcObject = null;
  const tracks = currentStream.getTracks();
  for (let i = 0; i < tracks.length; ++i) {
    tracks[i].stop();
  }
  currentStream = null;
}

// Start video play-out of the captured MediaStream.
function playCapturedStream(stream) {
  if (!stream) {
    printErrorMessage(
      'Error starting tab capture: ' +
        (chrome.runtime.lastError.message || 'UNKNOWN')
    );
    return;
  }
  if (currentStream != null) {
    shutdownReceiver();
  }
  currentStream = stream;
  const player = document.getElementById('player');
  player.addEventListener(
    'canplay',
    function () {
      this.volume = 0.75;
      this.muted = false;
      this.play();
    },
    {
      once: true
    }
  );
  player.setAttribute('controls', '1');
  player.srcObject = stream;
}

function testGetMediaStreamId(targetTabId, consumerTabId) {
  chrome.tabCapture.getMediaStreamId(
    { targetTabId, consumerTabId },
    function (streamId) {
      if (typeof streamId !== 'string') {
        printErrorMessage(
          'Failed to get media stream id: ' +
            (chrome.runtime.lastError.message || 'UNKNOWN')
        );
        return;
      }

      navigator.webkitGetUserMedia(
        {
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'tab', // The media source must be 'tab' here.
              chromeMediaSourceId: streamId
            }
          }
        },
        function (stream) {
          playCapturedStream(stream);
        },
        function (error) {
          printErrorMessage(error);
        }
      );
    }
  );
}

chrome.runtime.onMessage.addListener(function (request) {
  const { targetTabId, consumerTabId } = request;
  testGetMediaStreamId(targetTabId, consumerTabId);
});

window.addEventListener('beforeunload', shutdownReceiver);
