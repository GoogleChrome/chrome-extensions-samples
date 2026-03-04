/* global Translator */
const altTextInput = document.getElementById('altText');
const loading = document.getElementById('loading');
const lang = document.getElementById('lang');
let text = '';

lang.addEventListener('change', async function () {
  altTextInput.setAttribute('hidden', true);
  loading.removeAttribute('hidden');
  text = await translate(text);
  showAltText();
});

async function translate(string) {
  try {
    const translator = await Translator.create({
      sourceLanguage: 'en',
      targetLanguage: lang.value
    });
    return translator.translate(string);
  } catch (e) {
    console.error(e);
    return e.message;
  }
}

async function showAltText() {
  altTextInput.value = text;
  loading.setAttribute('hidden', true);
  altTextInput.removeAttribute('hidden');
}

chrome.runtime.onMessage.addListener(async function (request) {
  if (request.action === 'alt-text') {
    text = request.text;
    if (lang.value != 'en') {
      text = await translate(text);
    }
    showAltText();
  }
});

document.getElementById('copyClose').addEventListener('click', async () => {
  const altText = altTextInput.value;
  await navigator.clipboard.writeText(altText);
  window.close();
});

document.getElementById('discard').addEventListener('click', () => {
  window.close();
});
