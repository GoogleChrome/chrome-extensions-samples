// Copyright 2026 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

navigator.mediaDevices
  .getUserMedia({ audio: true })
  .then((stream) => {
    // The stream is unused; this page exists to trigger the permission
    // prompt.
    stream.getTracks().forEach((track) => track.stop());
    window.close();
  })
  .catch((error) => {
    document.getElementById('status').textContent =
      'Microphone access was not granted: ' + error.message;
  });
