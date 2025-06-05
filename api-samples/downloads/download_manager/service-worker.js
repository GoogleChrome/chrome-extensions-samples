chrome.downloads.setUiOptions({ enabled: false });

const colors = {
  progressColor: '#0d0',
  arrow: '#555',
  danger: 'red',
  complete: 'green',
  paused: 'grey',
  background: 'white'
};

Math.TAU = 2 * Math.PI; // http://tauday.com/tau-manifesto

function drawProgressArc(ctx, startAngle, endAngle) {
  const center = ctx.canvas.width / 2;
  ctx.lineWidth = Math.round(ctx.canvas.width * 0.1);
  ctx.beginPath();
  ctx.moveTo(center, center);
  ctx.arc(center, center, center * 0.9, startAngle, endAngle, false);
  ctx.fill();
  ctx.stroke();
}

function drawUnknownProgressSpinner(ctx) {
  const segments = 16;
  const segArc = Math.TAU / segments;
  for (let seg = 0; seg < segments; ++seg) {
    ctx.fillStyle = ctx.strokeStyle =
      seg % 2 == 0 ? colors.progressColor : colors.background;
    drawProgressArc(ctx, (seg - 4) * segArc, (seg - 3) * segArc);
  }
}

function drawProgressSpinner(ctx, stage) {
  ctx.fillStyle = ctx.strokeStyle = colors.progressColor;
  const clocktop = -Math.TAU / 4;
  drawProgressArc(ctx, clocktop, clocktop + stage * Math.TAU);
}

function drawArrow(ctx) {
  ctx.beginPath();
  ctx.lineWidth = Math.round(ctx.canvas.width * 0.1);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = colors.arrow;
  const center = ctx.canvas.width / 2;
  const minw2 = center * 0.2;
  const maxw2 = center * 0.6;
  const height2 = maxw2;
  ctx.moveTo(center - minw2, center - height2);
  ctx.lineTo(center + minw2, center - height2);
  ctx.lineTo(center + minw2, center);
  ctx.lineTo(center + maxw2, center);
  ctx.lineTo(center, center + height2);
  ctx.lineTo(center - maxw2, center);
  ctx.lineTo(center - minw2, center);
  ctx.lineTo(center - minw2, center - height2);
  ctx.lineTo(center + minw2, center - height2);
  ctx.stroke();
  ctx.fill();
}

function drawDangerBadge(ctx) {
  const s = ctx.canvas.width / 100;
  ctx.fillStyle = colors.danger;
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = Math.round(s * 5);
  const edge = ctx.canvas.width - ctx.lineWidth;
  ctx.beginPath();
  ctx.moveTo(s * 75, s * 55);
  ctx.lineTo(edge, edge);
  ctx.lineTo(s * 55, edge);
  ctx.lineTo(s * 75, s * 55);
  ctx.lineTo(edge, edge);
  ctx.fill();
  ctx.stroke();
}

function drawPausedBadge(ctx) {
  const s = ctx.canvas.width / 100;
  ctx.beginPath();
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = Math.round(s * 5);
  ctx.rect(s * 55, s * 55, s * 15, s * 35);
  ctx.fillStyle = colors.paused;
  ctx.fill();
  ctx.stroke();
  ctx.rect(s * 75, s * 55, s * 15, s * 35);
  ctx.fill();
  ctx.stroke();
}

function drawCompleteBadge(ctx) {
  const s = ctx.canvas.width / 100;
  ctx.beginPath();
  ctx.arc(s * 75, s * 75, s * 15, 0, Math.TAU, false);
  ctx.fillStyle = colors.complete;
  ctx.fill();
  ctx.strokeStyle = colors.background;
  ctx.lineWidth = Math.round(s * 5);
  ctx.stroke();
}

function drawIcon(side, options) {
  const canvas = new OffscreenCanvas(side, side);
  const ctx = canvas.getContext('2d');
  if (options.anyInProgress) {
    if (options.anyMissingTotalBytes) {
      drawUnknownProgressSpinner(ctx);
    } else {
      drawProgressSpinner(
        ctx,
        options.totalBytesReceived / options.totalTotalBytes
      );
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

function setActionIcon(options) {
  const canvas1 = drawIcon(19, options);
  const canvas2 = drawIcon(38, options);
  const imageData = {};
  imageData['' + canvas1.width] = canvas1
    .getContext('2d')
    .getImageData(0, 0, canvas1.width, canvas1.height);
  imageData['' + canvas2.width] = canvas2
    .getContext('2d')
    .getImageData(0, 0, canvas2.width, canvas2.height);
  chrome.action.setIcon({ imageData: imageData });
}

async function pollProgress() {
  pollProgress.tid = -1;
  const items = await chrome.downloads.search({});

  let popupLastOpened = (await chrome.storage.local.get(['popupLastOpened']))
    .popupLastOpened;
  if (!popupLastOpened) {
    popupLastOpened = new Date().getTime();
    await chrome.storage.local.set({ popupLastOpened });
  }
  const options = {
    anyMissingTotalBytes: false,
    anyInProgress: false,
    anyRecentlyCompleted: false,
    anyPaused: false,
    anyDangerous: false,
    totalBytesReceived: 0,
    totalTotalBytes: 0
  };
  items.forEach(function (item) {
    if (item.state == 'in_progress') {
      options.anyInProgress = true;
      if (item.totalBytes) {
        options.totalTotalBytes += item.totalBytes;
        options.totalBytesReceived += item.bytesReceived;
      } else {
        options.anyMissingTotalBytes = true;
      }
      const dangerous = item.danger != 'safe' && item.danger != 'accepted';
      options.anyDangerous = options.anyDangerous || dangerous;
      options.anyPaused = options.anyPaused || item.paused;
    } else if (item.state == 'complete' && item.endTime && !item.error) {
      options.anyRecentlyCompleted =
        options.anyRecentlyCompleted ||
        new Date(item.endTime).getTime() >= popupLastOpened;
    }
  });

  const targetIcon = JSON.stringify(options);
  let currentIcon = (await chrome.storage.session.get(['currentIcon']))
    .currentIcon;
  if (currentIcon != targetIcon) {
    setActionIcon(options);
    currentIcon = targetIcon;
    await chrome.storage.session.set({ currentIcon });
  }

  if (options.anyInProgress && pollProgress.tid < 0) {
    pollProgress.start();
  }
}
pollProgress.tid = -1;
pollProgress.MS = 200;

pollProgress.start = function () {
  if (pollProgress.tid < 0) {
    pollProgress.tid = setTimeout(pollProgress, pollProgress.MS);
  }
};

chrome.downloads.onCreated.addListener(function () {
  pollProgress();
});

pollProgress();

chrome.runtime.onMessage.addListener(function (request) {
  if (request == 'poll') {
    pollProgress.start();
  }
  if (request == 'icons') {
    [16, 19, 38, 128].forEach(function (s) {
      const canvas = drawIcon(s);
      chrome.downloads.download({
        url: canvas.toDataURL('image/png', 1.0),
        filename: 'icon' + s + '.png'
      });
    });
  }
});
