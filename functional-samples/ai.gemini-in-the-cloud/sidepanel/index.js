import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory
} from '../node_modules/@google/generative-ai/dist/index.mjs';

import TabAudioRecorder from './tab-audio-recorder';
import getScreenshot from './screenshot';

// Important! Do not expose your API in your extension code. You have to
// options:
//
// 1. Let users provide their own API key.
// 2. Manage API keys in your own server and proxy all calls to the Gemini
// API through your own server, where you can implement additional security
// measures such as authentification.
//
// It is only OK to put your API key into this file if you're the only
// user of your extension or for testing.
const apiKey = 'AIzaSyAiTmPF3fbapEgNtpkVyAOxNb0GZbvLfyE';

let genAI = null;
let model = null;
let generationConfig = {
  temperature: 1
};
let promptFiles = [];
let screenshotCount = 0;
let audioRecordingCount = 0;

const tabAudioRecorder = new TabAudioRecorder();

const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const buttonReset = document.body.querySelector('#button-reset');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const labelTemperature = document.body.querySelector('#label-temperature');
const elementAudioFile = document.getElementById('audio-file');
const buttonAudioFile = document.getElementById('button-record-audio');
const elementImageFile = document.getElementById('image-file');
const buttonImageFile = document.getElementById('button-add-image');
const listFiles = document.getElementById('files-list');
const buttonCaptureAudio = document.getElementById('button-capture-audio');
const buttonCaptureAudioStop = document.getElementById(
  'button-capture-audio-stop'
);
const buttonCaptureImage = document.getElementById('button-capture-image');

buttonImageFile.addEventListener(
  'click',
  () => {
    elementImageFile.click();
  },
  false
);
elementImageFile.addEventListener('change', async () => {
  uploadFiles(elementImageFile.files, 'image');
});

buttonAudioFile.addEventListener(
  'click',
  () => {
    elementAudioFile.click();
  },
  false
);

elementAudioFile.addEventListener('change', async () => {
  uploadFiles(elementAudioFile.files, 'audio');
});

buttonCaptureImage.addEventListener('click', async () => {
  try {
    const screenshot = await getScreenshot();
    console.log('screenshot', screenshot);
    const fileName =
      screenshotCount > 0 ? `Screenshot_${screenshotCount + 1}` : 'Screenshot';
    renderUploadedFile(fileName, 'image', screenshot.data);
    const imagePart = {
      inlineData: { data: screenshot.base64, mimeType: 'image/png' }
    };
    promptFiles.push({
      name: fileName,
      preview: screenshot,
      mimeType: 'image/png',
      imagePart
    });
    screenshotCount++;
  } catch (e) {
    console.log(e);
    alert(e.message);
  }
});

buttonCaptureAudio.addEventListener('click', async () => {
  try {
    await tabAudioRecorder.start();
    hide(buttonCaptureAudio);
    show(buttonCaptureAudioStop);
  } catch (e) {
    console.error(e);
    alert(e.message);
  }
});

buttonCaptureAudioStop.addEventListener('click', async () => {
  tabAudioRecorder.stop();
  show(buttonCaptureAudio);
  hide(buttonCaptureAudioStop);
});

async function uploadFiles(files, type) {
  for (const file of files) {
    // getting base64 from file to render in DOM
    const base64 = await getBase64(file);
    // generating content model for Gemini Google AI
    const imagePart = await fileToGenerativePart(file);
    renderUploadedFile(file.name, type, base64);
    promptFiles.push({
      name: file.name,
      preview: base64,
      imagePart
    });
  }
}

function renderUploadedFile(name, type) {
  const fileElement = document.createElement('LI');
  fileElement.textContent = name;
  fileElement.classList.add(type);
  listFiles.appendChild(fileElement);
}

function getBase64(file) {
  return new Promise(function (resolve, reject) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject('Error: ', error);
  });
}

async function fileToGenerativePart(file) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });

  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type }
  };
}

function initModel(generationConfig) {
  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ];
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings,
    generationConfig
  });
  return model;
}

async function runPrompt(prompt) {
  try {
    const result = await model.generateContent([
      prompt,
      ...promptFiles.map((f) => f.imagePart)
    ]);
    const response = await result.response;
    return response.text();
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    throw e;
  }
}

sliderTemperature.addEventListener('input', (event) => {
  labelTemperature.textContent = event.target.value;
  generationConfig.temperature = event.target.value;
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
    const generationConfig = {
      temperature: sliderTemperature.value
    };
    initModel(generationConfig);
    const response = await runPrompt(prompt, generationConfig);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

buttonReset.addEventListener('click', async () => {
  promptFiles = [];
  listFiles.textContent = '';
  model = null;
  elementAudioFile.value = null;
  elementImageFile.value = null;
  screenshotCount = 0;
  audioRecordingCount = 0;
});

function showLoading() {
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
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    if (paragraph) {
      elementResponse.appendChild(document.createTextNode(paragraph));
    }
    // Don't add a new line after the final paragraph
    if (i < paragraphs.length - 1) {
      elementResponse.appendChild(document.createElement('BR'));
    }
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
