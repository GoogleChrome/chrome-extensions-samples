const imageIds = ['test2', 'test4'];

const loadButton = document.createElement('button');
loadButton.innerText = 'Load images';
loadButton.addEventListener('click', handleLoadRequest);

document.querySelector('body').append(loadButton);

function handleLoadRequest() {
  for (const id of imageIds) {
    const element = document.getElementById(id);
    element.src = chrome.runtime.getURL(`${id}.png`);
  }
}
