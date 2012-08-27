/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Eric Bidelman (ericbidelman@chromium.org)
*/

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
