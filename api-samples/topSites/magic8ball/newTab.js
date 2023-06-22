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

function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u); // this encodes the URL as well
  url.searchParams.set('size', '16');
  return url.toString();
}

function thumbnailsGotten(data) {
  let eightBallWindow = document.getElementById('mostVisitedThumb');
  let rand = Math.floor(Math.random() * data.length);
  eightBallWindow.href = data[rand].url;
  eightBallWindow.textContent = data[rand].title;
  eightBallWindow.style.backgroundImage =
    'url(' + faviconURL(data[rand].url) + ')';
}

window.onload = function () {
  chrome.topSites.get(thumbnailsGotten);
};
