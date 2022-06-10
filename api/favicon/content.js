window.onload = e => {
  const img = document.createElement('img');
  const url = `chrome-extension://${chrome.runtime.id}/_favicon/?page_url=`;
  img.src = `${url}https://www.google.com&size=64`;
  document.body.appendChild(img);
}
