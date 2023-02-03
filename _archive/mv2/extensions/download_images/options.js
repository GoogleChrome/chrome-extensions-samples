// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict'

// Selects saveImagesOption checkbox element
let saveImagesOption = document.getElementById('save_images');
// Selects thumbnailOption checkbox element
let thumbnailOption = document.getElementById('thumbnails');

function setCheckbox(data, checkbox) {
  checkbox.checked = data;
};

// Gets thumbnails and saveImages value from storage
chrome.storage.local.get(['saveImages', 'thumbnails'], function(data) {
  setCheckbox(data.saveImages, saveImagesOption);
  saveImagesOption.checked = data.saveImages === true;
  setCheckbox(data.thumbnails, thumbnailOption);
});

// Saves users prefrences
function storeOption(optionName, optionValue) {
  let data = {};
  data[optionName] = optionValue;
  chrome.storage.local.set(data);
};

saveImagesOption.onchange = function() {
  storeOption('saveImages', saveImagesOption.checked);
};

thumbnailOption.onchange = function() {
  storeOption('thumbnails', thumbnailOption.checked);
};

let savedImages = document.getElementById('savedImages');

let deleteButton = document.getElementById('delete_button');

deleteButton.onclick = function() {
  let blankArray = [];
  chrome.storage.local.set({'savedImages': blankArray});
  location.reload();
};
// Gets saved downloaded images from storage
chrome.storage.local.get('savedImages', function(element) {
  let pageImages = element.savedImages;
  pageImages.forEach(function(image) {
    // Create div element and give it class of square
    let newDiv = document.createElement('div');
    newDiv.className = 'square';
    // Create image element
    let newImage = document.createElement('img');
    // let lineBreak = document.createElement('br');
    // Image source is equal to saved download image
    newImage.src = image;
    newImage.addEventListener('click', function() {
      chrome.downloads.download({url: newImage.src});
    });
    // Append all elements to options page
    newDiv.appendChild(newImage);
    savedImages.appendChild(newDiv);
  });
});
