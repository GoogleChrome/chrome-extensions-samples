// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function $(id) {
  return document.getElementById(id);
}

function thumbnailsGotten(data) {
  var eightBallWindow = $('mostVisitedThumb');
  var rand = Math.floor(Math.random() * data.length);
  eightBallWindow.href = data[rand].url;
  eightBallWindow.textContent = data[rand].title;
  eightBallWindow.style.backgroundImage = 'url(chrome://favicon/' +
      data[rand].url + ')';
}

window.onload = function() {
  chrome.topSites.get(thumbnailsGotten);
}
