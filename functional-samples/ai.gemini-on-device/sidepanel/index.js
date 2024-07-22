const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const buttonReset = document.body.querySelector('#button-reset');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const sliderTopK = document.body.querySelector('#top-k');
const labelTemperature = document.body.querySelector('#label-temperature');
const labelTopK = document.body.querySelector('#label-top-k');

let session;

async function runPrompt(prompt, params) {
  try {
    if (!session) {
      // Start by checking if it's possible to create a session based on the availability of the model, and the characteristics of the device.
      const canCreate = await self.ai.canCreateTextSession();
      // canCreate will be one of the following:
      // * "readily": the model is available on-device and so creating will happen quickly
      // * "after-download": the model is not available on-device, but the device is capable,
      //   so creating the session will start the download process (which can take a while).
      // * "no": the model is not available for this device.
      if (canCreate === 'no') {
        console.warn('Built-in prompt API not available.');
        throw new Error(
          'Built-in prompt API not available. Join the preview program to learn how to enable it.'
        );
      }
      console.log('Creating new text session');
      session = await self.ai.createTextSession(params);
    }
    return session.prompt(prompt);
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    // Reset session
    reset();
    throw e;
  }
}

async function reset() {
  if (session) {
    session.destroy();
  }
  session = null;
}

async function initDefaults() {
  const defaults = await window.ai.defaultTextSessionOptions();
  console.log('Model default:', defaults);
  sliderTemperature.value = defaults.temperature;
  sliderTopK.value = defaults.topK;
  labelTopK.textContent = defaults.topK;
  labelTemperature.textContent = defaults.temperature;
  labelTemperature.value = defaults.temperature;
}

initDefaults();

buttonReset.addEventListener('click', () => {
  hide(elementLoading);
  hide(elementError);
  hide(elementResponse);
  reset();
  buttonReset.setAttribute('disabled', '');
});

sliderTemperature.addEventListener('input', (event) => {
  labelTemperature.textContent = event.target.value;
  reset();
});

sliderTopK.addEventListener('input', (event) => {
  labelTopK.textContent = event.target.value;
  reset();
});

inputPrompt.addEventListener('input', () => {
  if (inputPrompt.value.trim()) {
    buttonPrompt.removeAttribute('disabled');
  } else {
    buttonPrompt.setAttribute('disabled', '');
  }
});

buttonPrompt.addEventListener('click', async () => {
  const prompt = inputPrompt.value.trim();
  showLoading();
  try {
    const params = {
      temperature: sliderTemperature.value,
      topK: sliderTopK.value
    };
    const response = await runPrompt(prompt, params);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

function showLoading() {
  buttonReset.removeAttribute('disabled');
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  // Make sure to preserve line breaks in the response
  elementResponse.textContent = '';
  const paragraphs = response.split(/\r?\n/);
  for (const paragraph of paragraphs) {
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    elementResponse.appendChild(document.createElement('BR'));
  }
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function show(element) {
  element.removeAttribute('hidden');
}

function hide(element) {
  element.setAttribute('hidden', '');
}
