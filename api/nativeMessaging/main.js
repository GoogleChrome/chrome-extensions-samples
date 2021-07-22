// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let port = null;

const appendMessage = (text) => {
  document.getElementById('response').innerHTML += '<p>' + text + '</p>';
}

const updateUiState = () => {
  if (port) {
    document.getElementById('connect-button').style.display = 'none';
    document.getElementById('input-text').style.display = 'block';
    document.getElementById('send-message-button').style.display = 'block';
  } else {
    document.getElementById('connect-button').style.display = 'block';
    document.getElementById('input-text').style.display = 'none';
    document.getElementById('send-message-button').style.display = 'none';
    document.getElementById('response').innerHTML = '';
  }
}

const sendNativeMessage = () => {
  try {
    const message = JSON.parse(document.getElementById('input-text').value);
    port.postMessage(message);
    appendMessage('Sent message: <b>' + JSON.stringify(message) + '</b>');
  } catch (e) {
    console.error(e.message);
    if (e.message === 'Attempting to use a disconnected port object') {
      onDisconnected(null);
    }
  }
}

const onNativeMessage = (message) => {
  appendMessage('Received message: <b>' + JSON.stringify(message) + '</b>');
}

const onDisconnected = (e) => {
  if (e) {
    appendMessage(chrome.runtime.lastError.message);
  }
  port = null;
  updateUiState();
}

const connect = () => {
  const hostName = 'com.google.chrome.example.ping.pong';
  appendMessage('Connecting to native messaging host <b>' + hostName + '</b>');
  try {
    port = chrome.runtime.connectNative(hostName);
    port.onMessage.addListener(onNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
    updateUiState();
  } catch (e) {
    console.error(chrome.runtime.lastError.message);
  }
}

const disconnect = () => {
  if (port) {
    port.disconnect();
    onDisconnected(null);
  }
}

const handleDOMContentLoaded = (e) => {
  document.getElementById('connect-button')
  .addEventListener('click', connect);
  document.getElementById('send-message-button')
  .addEventListener('click', sendNativeMessage);
  document.getElementById('disconnect-button')
  .addEventListener('click', disconnect);
  updateUiState();
}

document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);

