/**
 * @fileoverview This code supports the popup behaviour of the extension, and
 *               demonstrates how to:
 *
 *               1) Set the zoom for a tab using tabs.setZoom()
 *               2) Read the current zoom of a tab using tabs.getZoom()
 *               3) Set the zoom mode of a tab using tabs.setZoomSettings()
 *               4) Read the current zoom mode of a tab using
 *               tabs.getZoomSettings()
 *
 *               It also demonstrates using a zoom change listener to update the
 *               contents of a control.
 */

const zoomStep = 1.1;
let tabId = -1;

function displayZoomLevel(level) {
  const percentZoom = parseFloat(level) * 100;
  const zoom_percent_str = percentZoom.toFixed(1) + '%';

  document.getElementById('displayDiv').textContent = zoom_percent_str;
}

document.addEventListener('DOMContentLoaded', async function () {
  // Find the tabId of the current (active) tab. We could just omit the tabId
  // parameter in the function calls below, and they would act on the current
  // tab by default, but for the purposes of this demo we will always use the
  // API with an explicit tabId to demonstrate its use.
  const tabs = await chrome.tabs.query({ active: true });
  if (tabs.length > 1)
    console.log(
      '[ZoomDemoExtension] Query unexpectedly returned more than 1 tab.'
    );
  tabId = tabs[0].id;

  const zoomSettings = await chrome.tabs.getZoomSettings(tabId);
  const modeRadios = document.getElementsByName('modeRadio');
  for (let i = 0; i < modeRadios.length; i++) {
    if (modeRadios[i].value == zoomSettings.mode) modeRadios[i].checked = true;
  }

  const scopeRadios = document.getElementsByName('scopeRadio');
  for (let i = 0; i < scopeRadios.length; i++) {
    if (scopeRadios[i].value == zoomSettings.scope)
      scopeRadios[i].checked = true;
  }

  const percentDefaultZoom = parseFloat(zoomSettings.defaultZoomFactor) * 100;
  document.getElementById('defaultLabel').textContent =
    'Default: ' + percentDefaultZoom.toFixed(1) + '%';

  const zoomFactor = await chrome.tabs.getZoom(tabId);
  displayZoomLevel(zoomFactor);

  document.getElementById('increaseButton').onclick = doZoomIn;
  document.getElementById('decreaseButton').onclick = doZoomOut;
  document.getElementById('defaultButton').onclick = doZoomDefault;
  document.getElementById('setModeButton').onclick = doSetMode;
  document.getElementById('closeButton').onclick = doClose;
});

function zoomChangeListener(zoomChangeInfo) {
  displayZoomLevel(zoomChangeInfo.newZoomFactor);
}

chrome.tabs.onZoomChange.addListener(zoomChangeListener);

function errorHandler(error) {
  console.log('[ZoomDemoExtension] ' + error.message);
}

async function changeZoomByFactorDelta(factorDelta) {
  if (tabId == -1) return;

  const zoomFactor = await chrome.tabs.getZoom(tabId);
  const newZoomFactor = factorDelta * zoomFactor;
  chrome.tabs.setZoom(tabId, newZoomFactor).catch(errorHandler);
}

function doZoomIn() {
  changeZoomByFactorDelta(zoomStep);
}

function doZoomOut() {
  changeZoomByFactorDelta(1.0 / zoomStep);
}

function doZoomDefault() {
  if (tabId == -1) return;

  chrome.tabs.setZoom(tabId, 0).catch(errorHandler);
}

function doSetMode() {
  if (tabId == -1) return;

  let modeVal;
  const modeRadios = document.getElementsByName('modeRadio');
  for (let i = 0; i < modeRadios.length; i++) {
    if (modeRadios[i].checked) modeVal = modeRadios[i].value;
  }

  let scopeVal;
  const scopeRadios = document.getElementsByName('scopeRadio');
  for (let i = 0; i < scopeRadios.length; i++) {
    if (scopeRadios[i].checked) scopeVal = scopeRadios[i].value;
  }

  if (!modeVal || !scopeVal) {
    console.log(
      '[ZoomDemoExtension] Must specify values for both mode & scope.'
    );
    return;
  }

  chrome.tabs
    .setZoomSettings(tabId, { mode: modeVal, scope: scopeVal })
    .catch(errorHandler);
}

function doClose() {
  self.close();
}
