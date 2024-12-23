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

function parseMilliseconds(timeframe) {
  let now = new Date().getTime();
  let milliseconds = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    '4weeks': 4 * 7 * 24 * 60 * 60 * 1000
  };

  if (milliseconds[timeframe]) return now - milliseconds[timeframe];

  if (timeframe === 'forever') return 0;

  return null;
}

function buttonClicked(event) {
  event.preventDefault();
  const option = document.getElementById('timeframe');
  let selectedTimeframe = option.value;
  let removal_start = parseMilliseconds(selectedTimeframe);
  if (removal_start == undefined) {
    return null;
  }
  chrome.browsingData.remove(
    { since: removal_start },
    {
      appcache: true,
      cache: true,
      cacheStorage: true,
      cookies: true,
      downloads: true,
      fileSystems: true,
      formData: true,
      history: true,
      indexedDB: true,
      localStorage: true,
      serverBoundCertificates: true,
      serviceWorkers: true,
      pluginData: true,
      passwords: true,
      webSQL: true
    }
  );
  const success = document.createElement('div');
  success.classList.add('overlay');
  success.setAttribute('role', 'alert');
  success.textContent = 'Data has been cleared.';
  document.body.appendChild(success);

  setTimeout(function () {
    success.classList.add('visible');
  }, 10);
  setTimeout(function () {
    if (close === false) success.classList.remove('visible');
    else window.close();
  }, 4000);
}

window.addEventListener('DOMContentLoaded', function () {
  const selection = document.getElementById('button');
  selection.addEventListener('click', buttonClicked);
});
