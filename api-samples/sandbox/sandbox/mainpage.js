// Copyright 2023 Google LLC
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

let counter = 0;
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('reset').addEventListener('click', function () {
    counter = 0;
    document.querySelector('#result').innerHTML = '';
  });

  document.getElementById('sendMessage').addEventListener('click', function () {
    counter++;
    let message = {
      command: 'render',
      templateName: 'sample-template-' + counter,
      context: { counter: counter }
    };
    document.getElementById('theFrame').contentWindow.postMessage(message, '*');
  });

  // on result from sandboxed frame:
  window.addEventListener('message', function () {
    document.querySelector('#result').innerHTML =
      event.data.result || 'invalid result';
  });
});
