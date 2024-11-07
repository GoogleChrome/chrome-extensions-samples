export default function fetchTitle(url, callback) {
  let xhr = new XMLHttpRequest();

  xhr.open('GET', url, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      let title = xhr.responseText.match(/<title>([^<]+)<\/title>/)[1];
      callback(null, title);
    } else {
      callback(new Error('Failed to load URL: ' + xhr.statusText));
    }
  };

  xhr.onerror = function () {
    callback(new Error('Network error'));
  };

  xhr.send();
}
