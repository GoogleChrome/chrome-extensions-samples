setTimeout(() =>sendMessageToIframe(), 500)// Timeout required to actually wait for the iframe to get generated


function sendMessageToIframe() {
    
    var iframe = document.getElementById('theFrame');
    var message = {
        command: 'render',
        context: { thing: 'world' }
    };
    
    iframe.contentWindow.postMessage(message, '*');
    return true
}


window.addEventListener('message', onMessageFromIframeCallback)// attach event listener for iframe's message


function onMessageFromIframeCallback(event) {
    if (event.data.html) {
        new Notification('Templated!', {
            icon: 'icon.png',
            body: 'HTML Received for "' + event.data.name + '": `' +
                event.data.html + '`'
        });
    }

    console.log(event.data.html)
    document.getElementById('result').innerText = event.data.html// Added Change to exclude innerHTML > This is just an example of the data fetched from the iFrame
}

