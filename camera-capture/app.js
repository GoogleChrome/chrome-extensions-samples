/**
 * Grabs the camera feed from the browser, requesting
 * both video and audio. Requires the permissions
 * for audio and video to be set in the manifest.
 *
 * @see http://developer.chrome.com/trunk/apps/manifest.html#permissions
 */
function getCamera() {
	navigator.webkitGetUserMedia({audio: true, video: true}, function(stream) {
    document.querySelector('video').src = webkitURL.createObjectURL(stream);
  }, function(e) {
    console.error(e);
  });
}

/**
 * Click handler to init the camera grab
 */
document.querySelector('button').addEventListener('click', function(e) {
	getCamera();
});
