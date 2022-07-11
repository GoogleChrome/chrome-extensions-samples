window.onload = e => {
  const img = document.createElement('img');
  const url = '_favicon/?page_url=https://www.google.com&size=64';
  img.src = chrome.runtime.getURL(url);
  document.body.appendChild(img);
}
