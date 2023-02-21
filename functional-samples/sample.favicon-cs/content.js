function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', u); // this encodes the URL as well
  url.searchParams.set('size', '32');
  return url.toString();
}

const imageOverlay = document.createElement('img');
imageOverlay.src = faviconURL('https://www.google.com');
imageOverlay.alt = "Google's favicon";
imageOverlay.classList.add('favicon-overlay');
document.body.appendChild(imageOverlay);
