const GET_RESPONSE_BUTTON = document.getElementById('get-response');
let counter = 0;

GET_RESPONSE_BUTTON.addEventListener('click', async () => {
  const response = await chrome.runtime.sendMessage('ping');

  if (response) {
    const element = document.createElement('p');
    element.id = `response-${counter}`;
    element.innerText = `Response ${counter}: ${response}`;
    document.body.appendChild(element);

    counter++;
  }
});
