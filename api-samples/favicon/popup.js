function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u); // this encodes the URL as well
  url.searchParams.set('size', '32');
  return url.toString();
}

const img = document.createElement('img');
// chrome-extension://EXTENSION_ID/_favicon/?pageUrl=https%3A%2F%2Fwww.google.com&size=32
img.src = faviconURL('https://www.google.com');
document.body.appendChild(img);
