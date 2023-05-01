// Copyright 2022 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const newPerms = {
  permissions: ['topSites']
};

const sites_div = document.getElementById('display_top');
const todo = document.getElementById('display_todo');
const form = document.querySelector('form');
const footer = document.querySelector('footer');

const createTop = () => {
  chrome.topSites.get((topSites) => {
    topSites.forEach((site) => {
      const div = document.createElement('div');
      div.className = 'colorFun';
      const tooltip = document.createElement('span');
      tooltip.innerText = site.title;
      tooltip.className = 'tooltip';
      const url = document.createElement('a');
      url.href = site.url;
      const hostname = new URL(site.url).hostname;
      const image = document.createElement('img');
      image.title = site.title;
      image.src = 'https://logo.clearbit.com/' + hostname;
      url.appendChild(image);
      div.appendChild(url);
      div.appendChild(tooltip);
      sites_div.appendChild(div);
    });
  });
};

chrome.permissions.contains({ permissions: ['topSites'] }).then((result) => {
  if (result) {
    // The extension has the permissions.
    createTop();
  } else {
    // The extension doesn't have the permissions.
    const button = document.createElement('button');
    button.innerText = 'Allow Extension to Access Top Sites';
    button.addEventListener('click', () => {
      chrome.permissions.request(newPerms).then((granted) => {
        if (granted) {
          console.log('granted');
          sites_div.innerText = '';
          createTop();
        } else {
          console.log('not granted');
        }
      });
    });
    footer.appendChild(button);
  }
});

form.addEventListener('submit', () => {
  const todo_value = document.getElementById('todo_value');
  chrome.storage.sync.set({ todo: todo_value.value });
});

function setToDo() {
  chrome.storage.sync.get(['todo']).then((value) => {
    if (!value.todo) {
      todo.innerText = '';
    } else {
      todo.innerText = value.todo;
    }
  });
}

setToDo();
