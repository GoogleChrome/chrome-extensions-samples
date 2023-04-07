let imageIds = ["test2", "test4"];

let loadButton = document.createElement('button');
loadButton.innerText = 'Load images';
loadButton.addEventListener('click', handleLoadRequest);

document.querySelector('body').append(loadButton);

function handleLoadRequest() {
  for (let id of imageIds) {
    let element = document.getElementById(id);
    element.src = chrome.runtime.getURL(`${id}.png`);
  }
}
