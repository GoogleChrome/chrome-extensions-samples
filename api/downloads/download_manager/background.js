// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

if (chrome.downloads.setShelfEnabled)
  chrome.downloads.setShelfEnabled(false);

var colors = {
  progressColor: '#0d0',
  arrow: '#555',
  danger: 'red',
  complete: 'green',
  paused: 'grey',
  background: 'white',
};

function drawLine(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

Math.TAU = 2 * Math.PI;  // http://tauday.com/tau-manifesto

function drawProgressArc(ctx, startAngle, endAngle) {
  var center = ctx.canvas.width/2;
  ctx.lineWidth = Math.round(ctx.canvas.width*0.1);
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.arc(center, center, center * 0.9, startAngle, endAngle, false);
  ctx.fill();
  ctx.stroke();
}

function drawUnknownProgressSpinner(ctx) {
  var center = ctx.canvas.width/2;
  const segments = 16;
  var segArc = Math.TAU / segments;
  for (var seg = 0; seg < segments; ++seg) {
    ctx.fillStyle = ctx.strokeStyle = (
      ((seg % 2) == 0) ? colors.progressColor : colors.background);
    drawProgressArc(ctx, (seg-4)*segArc, (seg-3)*segArc);
  }
}

function drawProgressSpinner(ctx, stage) {
  ctx.fillStyle = ctx.strokeStyle = colors.progressColor;
  var clocktop = -Math.TAU/4;
  drawProgressArc(ctx, clocktop, clocktop + (stage * Math.TAU));
}

function drawArrow(ctx) {
  ctx.beginPath();
  ctx.lineWidth = Math.round(ctx.canvas.width*0.1);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = colors.arrow;
  var center = ctx.canvas.width/2;
  var minw2 = center*0.2;
  var maxw2 = center*0.60;
  var height2 = maxw2;
  ctx.moveTo(center-minw2, center-height2);
  ctx.lineTo(center+minw2, center-height2);
  ctx.lineTo(center+minw2, center);
  ctx.lineTo(center+maxw2, center);
  ctx.lineTo(center, center+height2);
  ctx.lineTo(center-maxw2, center);
  ctx.lineTo(center-minw2, center);
  ctx.lineTo(center-minw2, center-height2);
  ctx.lineTo(center+minw2, center-height2);
  ctx.stroke();
  ctx.fill();
}

function drawDangerBadge(ctx) {
  var s = ctx.canvas.width/100;
  ctx.fillStyle = colors.danger;
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = Math.round(s*5);
  var edge = ctx.canvas.width-ctx.lineWidth;
  ctx.beginPath();
  ctx.moveTo(s*75, s*55);
  ctx.lineTo(edge, edge);
  ctx.lineTo(s*55, edge);
  ctx.lineTo(s*75, s*55);
  ctx.lineTo(edge, edge);
  ctx.fill();
  ctx.stroke();
}

function drawPausedBadge(ctx) {
  var s = ctx.canvas.width/100;
  ctx.beginPath();
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = Math.round(s*5);
  ctx.rect(s*55, s*55, s*15, s*35);
  ctx.fillStyle = colors.paused;
  ctx.fill();
  ctx.stroke();
  ctx.rect(s*75, s*55, s*15, s*35);
  ctx.fill();
  ctx.stroke();
}

function drawCompleteBadge(ctx) {
  var s = ctx.canvas.width/100;
  ctx.beginPath();
  ctx.arc(s*75, s*75, s*15, 0, Math.TAU, false);
  ctx.fillStyle = colors.complete;
  ctx.fill();
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = Math.round(s*5);
  ctx.stroke();
}

function drawIcon(side, options) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = side;
  document.body.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  if (options.anyInProgress) {
    if (options.anyMissingTotalBytes) {
      drawUnknownProgressSpinner(ctx);
    } else {
      drawProgressSpinner(ctx, (options.totalBytesReceived /
                                options.totalTotalBytes));
    }
  }
  drawArrow(ctx);
  if (options.anyDangerous) {
    drawDangerBadge(ctx);
  } else if (options.anyPaused) {
    drawPausedBadge(ctx);
  } else if (options.anyRecentlyCompleted) {
    drawCompleteBadge(ctx);
  }
  return canvas;
}

function maybeOpen(id) {
  var openWhenComplete = [];
  try {
    openWhenComplete = JSON.parse(localStorage.openWhenComplete);
  } catch (e) {
    localStorage.openWhenComplete = JSON.stringify(openWhenComplete);
  }
  var openNowIndex = openWhenComplete.indexOf(id);
  if (openNowIndex >= 0) {
    chrome.downloads.open(id);
    openWhenComplete.splice(openNowIndex, 1);
    localStorage.openWhenComplete = JSON.stringify(openWhenComplete);
  }
}

function setBrowserActionIcon(options) {
  var canvas1 = drawIcon(19, options);
  var canvas2 = drawIcon(38, options);
  var imageData = {};
  imageData['' + canvas1.width] = canvas1.getContext('2d').getImageData(
        0, 0, canvas1.width, canvas1.height);
  imageData['' + canvas2.width] = canvas2.getContext('2d').getImageData(
        0, 0, canvas2.width, canvas2.height);
  chrome.browserAction.setIcon({imageData:imageData});
  canvas1.parentNode.removeChild(canvas1);
  canvas2.parentNode.removeChild(canvas2);
}

function pollProgress() {
  pollProgress.tid = -1;
  chrome.downloads.search({}, function(items) {
    var popupLastOpened = parseInt(localStorage.popupLastOpened);
    var options = {anyMissingTotalBytes: false,
                   anyInProgress: false,
                   anyRecentlyCompleted: false,
                   anyPaused: false,
                   anyDangerous: false,
                   totalBytesReceived: 0,
                   totalTotalBytes: 0};
    items.forEach(function(item) {
      if (item.state == 'in_progress') {
        options.anyInProgress = true;
        if (item.totalBytes) {
          options.totalTotalBytes += item.totalBytes;
          options.totalBytesReceived += item.bytesReceived;
        } else {
          options.anyMissingTotalBytes = true;
        }
        var dangerous = ((item.danger != 'safe') &&
                         (item.danger != 'accepted'));
        options.anyDangerous = options.anyDangerous || dangerous;
        options.anyPaused = options.anyPaused || item.paused;
      } else if ((item.state == 'complete') && item.endTime && !item.error) {
        options.anyRecentlyCompleted = (
          options.anyRecentlyCompleted ||
          ((new Date(item.endTime)).getTime() >= popupLastOpened));
        maybeOpen(item.id);
      }
    });

    var targetIcon = JSON.stringify(options);
    if (sessionStorage.currentIcon != targetIcon) {
      setBrowserActionIcon(options);
      sessionStorage.currentIcon = targetIcon;
    }

    if (options.anyInProgress &&
        (pollProgress.tid < 0)) {
      pollProgress.start();
    }
  });
}
pollProgress.tid = -1;
pollProgress.MS = 200;

pollProgress.start = function() {
  if (pollProgress.tid < 0) {
    pollProgress.tid = setTimeout(pollProgress, pollProgress.MS);
  }
};

function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

if (!isNumber(localStorage.popupLastOpened)) {
  localStorage.popupLastOpened = '' + (new Date()).getTime();
}

chrome.downloads.onCreated.addListener(function(item) {
  pollProgress();
});

pollProgress();

function openWhenComplete(downloadId) {
  var ids = [];
  try {
    ids = JSON.parse(localStorage.openWhenComplete);
  } catch (e) {
    localStorage.openWhenComplete = JSON.stringify(ids);
  }
  pollProgress.start();
  if (ids.indexOf(downloadId) >= 0) {
    return;
  }
  ids.push(downloadId);
  localStorage.openWhenComplete = JSON.stringify(ids);
}

chrome.runtime.onMessage.addListener(function(request) {
  if (request == 'poll') {
    pollProgress.start();
  }
  if (request == 'icons') {
    [16, 19, 38, 128].forEach(function(s) {
      var canvas = drawIcon(s);
      chrome.downloads.download({
        url: canvas.toDataURL('image/png', 1.0),
        filename: 'icon' + s + '.png',
      });
      canvas.parentNode.removeChild(canvas);
    });
  }
  if (isNumber(request.openWhenComplete)) {
    openWhenComplete(request.openWhenComplete);
  }
});
