console.log("content-script")

function faviconURL(u) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"));
  url.searchParams.set("pageUrl", u); // this encodes the URL as well
  url.searchParams.set("size", "96");
  return url.toString();
}


const imageOverlay = document.createElement('img');
const image = imageOverlay.src = faviconURL("https://www.google.com");
imageOverlay.classList.add('image-overlay2343');
document.body.appendChild(imageOverlay);

