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

const words = {
  extensions:
    'Extensions are software programs, built on web technologies (such as HTML, CSS, and JavaScript) that enable users to customize the Chrome browsing experience.',
  popup:
    "A UI surface which appears when an extension's action icon is clicked."
};

chrome.runtime.onMessage.addListener(({ name, data }) => {
  if (name === 'define-word') {
    // Hide instructions.
    document.body.querySelector('#select-a-word').style.display = 'none';

    // Show word and definition.
    document.body.querySelector('#definition-word').innerText = data.value;
    document.body.querySelector('#definition-text').innerText =
      words[data.value.toLowerCase()];
  }
});
