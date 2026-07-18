// Store CSS data in the "local" storage area.
const storage = chrome.storage.local;

// Get at the DOM controls used in the sample.
const resetButton = document.querySelector('button.reset');
const submitButton = document.querySelector('button.submit');
const textarea = document.querySelector('textarea');

// Load any CSS that may have previously been saved.
loadChanges();

submitButton.addEventListener('click', saveChanges);
resetButton.addEventListener('click', reset);

async function saveChanges() {
  // Get the current CSS snippet from the form.
  const cssCode = textarea.value;
  // Check that there's some code there.
  if (!cssCode) {
    message('Error: No CSS specified');
    return;
  }
  // Save it using the Chrome extension storage API.
  await storage.set({ css: cssCode });
  message('Settings saved');
}

function loadChanges() {
  storage.get('css', function (items) {
    // To avoid checking items.css we could specify storage.get({css: ''}) to
    // return a default value of '' if there is no css value yet.
    if (items.css) {
      textarea.value = items.css;
      message('Loaded saved CSS.');
    }
  });
}

async function reset() {
  // Remove the saved value from storage. storage.clear would achieve the same
  // thing.
  await storage.remove('css');
  message('Reset stored CSS');
  // Refresh the text area.
  textarea.value = '';
}

let messageClearTimer;
function message(msg) {
  clearTimeout(messageClearTimer);
  const message = document.querySelector('.message');
  message.innerText = msg;
  messageClearTimer = setTimeout(function () {
    message.innerText = '';
  }, 3000);
}
