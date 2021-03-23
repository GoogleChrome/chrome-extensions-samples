const EMOJI = [
  'confetti',
  'suit',
  'bow',
  'dog',
  'skull',
  'yoyo',
  'cat',
];

let buttons = document.querySelectorAll('button');

// The action API does not expose a way to read the action's current enabled/disabled state, so we
// have to track it ourselves.
// Relevant feature request: https://bugs.chromium.org/p/chromium/issues/detail?id=1189295
let actionEnabled = true;
let showToggleState = document.getElementById('show-toggle-state');
document.getElementById('toggle-state-button').addEventListener('click', (_event) => {
  if (actionEnabled) {
    chrome.action.disable();
  } else {
    chrome.action.enable();
  }
  actionEnabled = !actionEnabled;
});

document.getElementById('set-popup-button').addEventListener('click', () => {
  let popup = document.getElementById('popup-options').value;
  chrome.action.setPopup({ popup });
});

let getPopupButton = document.getElementById('get-popup-button');
getPopupButton.addEventListener('click', () => {
  chrome.action.getPopup({}, (result) => {
    document.getElementById('current-popup-value').value = result;
  });
});

// Badge Text

document.getElementById('set-badge-text-button').addEventListener('click', () => {
  let text = document.getElementById('badge-text-input').value;
  chrome.action.setBadgeText({ text });
});

document
  .getElementById('get-badge-text-button')
  .addEventListener('click', () => {
    chrome.action.getBadgeText({}, (result) => {
      document.getElementById('current-badge-text').value = result;
    });
  }
  )

// Badge background color

document.getElementById('set-badge-background-color-button').addEventListener('click', () => {
  // To show off this method, we must first make sure that there is a badge value

  chrome.action.setBadgeText({ text: 'hi :)' });

  let color = new Array(4);
  for (let i = 0; i < color.length; i++) {
    color[i] = Math.floor(Math.random() * 256);
  }

  chrome.action.setBadgeBackgroundColor({ color });
});


document.getElementById('get-badge-background-color-button').addEventListener('click', () => {
  chrome.action.getBadgeBackgroundColor({}, (colorArray) => {
    document.getElementById('current-badge-bg-color').value = JSON.stringify(colorArray, null, 0);
  });
});

let lastIconIndex = 0;
document.getElementById('set-icon-button').addEventListener('click', async () => {
  lastIconIndex = (lastIconIndex + 1) % EMOJI.length;
  let emojiFile = `images/emoji-${EMOJI[lastIconIndex]}.png`;

  let response = await fetch(emojiFile);
  let blob = await response.blob();
  let imageBitmap = await createImageBitmap(blob);
  let osc = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  let ctx = osc.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0);

  let imageData = ctx.getImageData(0, 0, osc.width, osc.height);

  chrome.action.setIcon({ imageData });
});

// Title

document.getElementById('set-title-button').addEventListener('click', () => {
  let title = document.getElementById('title-input').value;
  chrome.action.setTitle({ title });
});

document.getElementById('get-title-button').addEventListener('click', () => {
  chrome.action.getTitle({}, (title) => {
    document.getElementById('current-title').value = title;
  });
});

// On Clicked

document.getElementById('onclicked-button').addEventListener('click', () => {
  // In order for our listener to receive the action click, we must first remove any popups set
  chrome.action.setPopup({ popup: '' });

  chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: 'https://html5zombo.com/' });
  });
});

document.getElementById('onclicked-reset-button').addEventListener('click', () => {
  chrome.action.setPopup({ popup: 'popups/popup.html' });
});
