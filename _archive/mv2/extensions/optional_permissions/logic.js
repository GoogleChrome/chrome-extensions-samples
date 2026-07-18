// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const kPermissionObj = {
  permissions: ['topSites']
};

const sites_div = document.getElementById('display_top');

const todo = document.getElementById('display_todo');

const form = document.querySelector('form');

const footer = document.querySelector('footer');

function createTop(){chrome.topSites.get(function(topSites) {
  topSites.forEach(function(site) {
    let div = document.createElement('div');
    div.className = 'colorFun';
    let tooltip = document.createElement('a');
    tooltip.href = site.url;
    tooltip.innerText = site.title;
    tooltip.className = 'tooltip';
    let url = document.createElement('a');
    url.href = site.url;
    let imageContainer = document.createElement('div');
    imageContainer.className = 'imageContainer';
    let image = document.createElement('img');
    image.title = site.title;
    image.src = 'chrome://favicon/' + site.url;
    imageContainer.appendChild(image);
    url.appendChild(imageContainer);
    div.appendChild(url);
    div.appendChild(tooltip);
    sites_div.appendChild(div);
  })
})};

chrome.permissions.contains({permissions: ['topSites']}, function(result) {
  if (result) {
    // The extension has the permissions.
    createTop();
  } else {
    // The extension doesn't have the permissions.
    let button = document.createElement('button');
    button.innerText = 'Allow Extension to Access Top Sites';
    button.addEventListener('click', function() {
      chrome.permissions.request(kPermissionObj, function(granted) {
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

form.addEventListener('submit', function() {
  let todo_value = document.getElementById('todo_value');
  chrome.storage.sync.set({todo: todo_value.value});
});

function setToDo() {
  chrome.storage.sync.get(['todo'], function(value) {
    if (!value.todo) {
      todo.innerText = '';
    } else {
      todo.innerText = value.todo;
    }
  });
};

setToDo();
