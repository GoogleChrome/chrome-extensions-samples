// Copyright 2022 Google LLC
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

chrome.tabs.query({ active: true }).then((tabs) => getMilestone(tabs));

function getMilestone(tabs) {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const url = tabs[0].url;
  const origin = 'https://chromium-review.googlesource.com';
  const search = `^${origin}/c/chromium/src/\\+/(\\d+)`;
  const match = url.match(search);
  if (match != undefined && match.length == 2) {
    getMilestoneForRevId(match[1]).then((milestone) =>
      milestone != '' ? (div.innerText = `m${milestone}`) : window.close()
    );
  } else {
    window.close();
  }
}

async function getMilestoneForRevId(revId) {
  const res = await fetch(`https://crrie.com/c/?r=${revId}`);
  return await res.text();
}
