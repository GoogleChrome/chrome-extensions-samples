function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u); // this encodes the URL as well
  url.searchParams.set("size", "64");
  return url.toString();
}

window.onload = e => {
  const img = document.createElement('img');
  img.src = faviconURL("https://google.com");
  document.body.appendChild(img);
}
