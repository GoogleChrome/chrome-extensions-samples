let currentStream = null;

function printErrorMessage(message) {
  const element = document.getElementById('echo-msg');
  element.innerText = message;
  console.error(message);
}

function printLogMessage(message) {
  const element = document.getElementById('echo-msg');
  element.innerText = message;
  console.log(message);
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

function testCapture() {
  printLogMessage('Test with method capture().');
  chrome.tabCapture.capture(
    {
      video: true,
      audio: true,
      videoConstraints: {
        mandatory: {
          // If minWidth/Height have the same aspect ratio (e.g., 16:9) as
          // maxWidth/Height, the implementation will letterbox/pillarbox as
          // needed. Otherwise, set minWidth/Height to 0 to allow output video
          // to be of any arbitrary size.
          minWidth: 16,
          minHeight: 9,
          maxWidth: 854,
          maxHeight: 480,
          maxFrameRate: 60 // Note: Frame rate is variable (0 <= x <= 60).
        }
      }
    },
    function (stream) {
      playCapturedStream(stream);
    }
  );
}

function testGetMediaStreamId() {
  printLogMessage('Test with method getMediaStreamId().');
  chrome.tabCapture.getMediaStreamId(function (streamId) {
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
  });
}

document.getElementById('capture-button').addEventListener('click', () => {
  testCapture();
});

document.getElementById('streamid-button').addEventListener('click', () => {
  testGetMediaStreamId();
});
