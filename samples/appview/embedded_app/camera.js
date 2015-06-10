navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;

navigator.getUserMedia({ video: true }, function(stream) {
  document.querySelector('video').src = URL.createObjectURL(stream);
}, function(error) {});
