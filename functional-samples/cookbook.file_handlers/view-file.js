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

const OUTPUT_ELEMENT_ID = 'data';

async function consumer(launchParams) {
  if (!launchParams.files || !launchParams.files.length) return;

  // Get metadata for each file.
  const files = await Promise.all(
    launchParams.files.map(async (f) => {
      const file = await f.getFile();

      return {
        name: file.name,
        size: file.size
      };
    })
  );

  // Show data on DOM.
  document.getElementById(OUTPUT_ELEMENT_ID).innerText = JSON.stringify(
    files,
    undefined,
    2
  );
}

// Register a consumer if the launchQueue API is available.
if ('launchQueue' in window) {
  window.launchQueue.setConsumer(consumer);
}
