function setStartedBy(startedBy) {
  document.getElementById('started-by').innerText = startedBy;
}

function updateData(data) {
  var p = document.getElementById('number');
  p.innerText = data.clicks;
  chrome.runtime.getBackgroundPage(function(c) {
    c.chrome.storage.local.set(data);
  });
}

document.getElementById('button').addEventListener('click', function(e) {
  chrome.runtime.getBackgroundPage(function(c) {
    c.chrome.storage.local.get('clicks', function(data) {
      data.clicks += 1;
      c.chrome.storage.local.set(data, function() {
        updateData(data);
      });
    });
  });
}, false);
