window.addEventListener('message', onMessageFromIframeCallback); // register event listener top onIframeMessage

const iframe = document.createElement('iframe');
iframe.src = 'sandbox.html';
iframe.addEventListener('load', (_e) => {
  // console.log(`iframe load event fired`);
  let message = {
    command: 'render',
    context: { thing: 'world' }
  };

  iframe.contentWindow.postMessage(message, '*');
});

document.body.append(iframe);

function onMessageFromIframeCallback(event) {
  event.data.html
    ? new Notification('Templated!', {
        icon: 'icon.png',
        body: `HTML Received for "${event.data.name}": \`${event.data.html}\``
      })
    : false;

  console.log(event.data.html);
  document.getElementById('result').innerText = event.data.html; // Added Change to exclude innerHTML > This is just an example of the data fetched from the iFrame
}
