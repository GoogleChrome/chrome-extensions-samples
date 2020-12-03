// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


/**
 * Quick template rendering function.  For each cell passed to it, check
 * to see if the cell's text content is a key in the supplied data array.
 * If yes, replace the cell's contents with the corresponding value and
 * unhide the cell.  If no, then remove the cell's parent (tr) from the
 * DOM.
 */
function renderCells(cells, data) {
  for (var i = 0; i < cells.length; i++) {
    var cell = cells[i];
    var key = cell.innerText;
    if (data[key]) {
      cell.innerText = data[key];
      cell.parentElement.className = "rendered";
    } else {
      cell.parentElement.parentElement.removeChild(cell.parentElement);
    }
  }
};

/**
 * Returns true if the supplies object has no properties.
 */
function isEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
};

/**
 * Resizes the window to the current dimensions of this page's body.
 */
function resizeWindow() {
  window.setTimeout(function() {
    chrome.tabs.getCurrent(function (tab) {
      var newHeight = Math.min(document.body.offsetHeight + 140, 700);
      chrome.windows.update(tab.windowId, {
        height: newHeight,
        width: 520
      });
    });
  }, 150);
};

/**
 * Called directly by the background page with information about the
 * image.  Outputs image data to the DOM.
 */
function renderImageInfo(imageinfo) {
  console.log('imageinfo', imageinfo);

  var divloader = document.querySelector('#loader');
  var divoutput = document.querySelector('#output');
  divloader.style.display = "none";
  divoutput.style.display = "block";

  var divinfo = document.querySelector('#info');
  var divexif = document.querySelector('#exif');

  // Render general image data.
  var datacells = divinfo.querySelectorAll('td');
  renderCells(datacells, imageinfo);

  // If EXIF data exists, unhide the EXIF table and render.
  if (imageinfo['exif'] && !isEmpty(imageinfo['exif'])) {
    divexif.style.display = 'block';
    var exifcells = divexif.querySelectorAll('td');
    renderCells(exifcells, imageinfo['exif']);
  }
};

/**
 * Renders the URL for the image, trimming if the length is too long.
 */
function renderUrl(url) {
  var divurl = document.querySelector('#url');
  var urltext = (url.length < 45) ? url : url.substr(0, 42) + '...';
  var anchor = document.createElement('a');
  anchor.href = url;
  anchor.innerText = urltext;
  divurl.appendChild(anchor);
};

/**
 * Renders a thumbnail view of the image.
 */
function renderThumbnail(url) {
  var canvas = document.querySelector('#thumbnail');
  var context = canvas.getContext('2d');

  canvas.width = 100;
  canvas.height = 100;

  var image = new Image();
  image.addEventListener('load', function() {
    var src_w = image.width;
    var src_h = image.height;
    var new_w = canvas.width;
    var new_h = canvas.height;
    var ratio = src_w / src_h;
    if (src_w > src_h) {
      new_h /= ratio;
    } else {
      new_w *= ratio;
    }
    canvas.width = new_w;
    canvas.height = new_h;
    context.drawImage(image, 0, 0, src_w, src_h, 0, 0, new_w, new_h);
  });
  image.src = url;
};

/**
 * Returns a function which will handle displaying information about the
 * image once the ImageInfo class has finished loading.
 */
function getImageInfoHandler(url) {
  return function() {
    renderUrl(url);
    renderThumbnail(url);
    var imageinfo = ImageInfo.getAllFields(url);
    renderImageInfo(imageinfo);
    resizeWindow();
  };
};

/**
 * Load the image in question and display it, along with its metadata.
 */
document.addEventListener("DOMContentLoaded", function () {
  // The URL of the image to load is passed on the URL fragment.
  var imageUrl = window.location.hash.substring(1);
  if (imageUrl) {
    // Use the ImageInfo library to load the image and parse it.
    ImageInfo.loadInfo(imageUrl, getImageInfoHandler(imageUrl));
  }
});
