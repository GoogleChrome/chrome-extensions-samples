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

document.addEventListener('DOMContentLoaded', () => {
  const basic = document.getElementById('basic');
  const progressNotif = document.getElementById('progress');
  const list = document.getElementById('list');

  basic.addEventListener('click', () => {
    let options = {
      type: 'basic',
      title: 'Basic Notification',
      message: 'This is a Basic Notification',
      iconUrl: 'icon.png'
    };
    chrome.notifications.create(options);
  });

  progressNotif.addEventListener('click', () => {
    let options = {
      type: 'progress',
      title: 'Progress Notification',
      message: 'This is a Progress Notification',
      iconUrl: 'icon.png',
      progress: 99
    };
    chrome.notifications.create(options);
  });

  list.addEventListener('click', () => {
    let options = {
      type: 'list',
      title: 'List Notification',
      message: 'This is a List Notification',
      iconUrl: 'icon.png',
      items: [
        { title: 'list element 1', message: 'list message 1' },
        { title: 'list element 2', message: 'list message 2' }
      ]
    };
    chrome.notifications.create(options);
  });
});
