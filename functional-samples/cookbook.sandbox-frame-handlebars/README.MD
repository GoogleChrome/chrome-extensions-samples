
# Sandbox Handlebars Template

This sample demonstrates how to use Handlebar templates from an iframe by passing the template with a message.

## Overview

```js
// popup.js
window.addEventListener('message', onMessageFromIframeCallback); // register event listener

const iframe = document.createElement('iframe'); // initiate Iframe
iframe.src = 'sandbox.html'; //set source of iframe
iframe.addEventListener('load', (_e) => {
  
  let message = {
    command: 'render',
    context: { thing: 'world' }
  }; // create message

  iframe.contentWindow.postMessage(message, '*'); // post message
}); // wait for iFrame to load

document.body.append(iframe); // append iframe to body

function onMessageFromIframeCallback(event) {
  event.data.html
    ? new Notification('Templated!', {
        icon: 'icon.png',
        body: `HTML Received for "${event.data.name}": \`${event.data.html}\``
      })
    : false; // Show notification for the data received before passing it to the wanted location


  document.getElementById('result').innerText = event.data.html; // display the data as text in #result
}

```
