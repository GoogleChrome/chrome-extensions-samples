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
/* eslint-disable no-undef */
//creates an initial notification when the action button is clicked.

//Creating a notification based on type
function createNotification(type) {
  let title, message, nextType;
  switch (type) {
    case 'basic':
      title = 'Basic Notification';
      message = 'Back to Basics!';
      nextType = 'image';
      break;
    case 'image':
      title = 'Image Notification';
      message = 'Look at this image notification!';
      nextType = 'progress';
      break;
    case 'progress':
      title = 'Progress Notification';
      message = "You've made it to the progress notification! (Almost there!)";
      nextType = 'list';
      break;
    case 'list':
      title = 'List Notification';
      message = "We've listed all types!";
      nextType = 'basic';
      break;
  }

  let options = {
    type: type,
    title: title,
    message: message,
    iconUrl: 'icon.png'
  };

  if (type == 'image') {
    options.imageUrl = chrome.runtime.getURL('/images/tahoe-320x215.png');
  }

  if (type == 'list') {
    options.items = [
      { title: 'list element 1', message: 'list message 1' },
      { title: 'list element 2', message: 'list message 2' }
    ];
  }

  if (type == 'progress') {
    options.progress = 99;
  }

  chrome.notifications.create(type, options);
}

chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('something');
  if (notificationId == 'basic') {
    createNotification('image');
  } else if (notificationId == 'image') {
    createNotification('progress');
  } else if (notificationId == 'progress') {
    createNotification('list');
  } else if (notificationId == 'list') {
    createNotification('basic');
  }
});

chrome.action.onClicked.addListener(() => {
  createNotification('basic');
});

//cycle through notification templates based on the previously created type.
