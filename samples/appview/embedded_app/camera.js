navigator.webkitGetUserMedia({ video: true }, function(stream) {
  document.querySelector('video').src = URL.createObjectURL(stream);
}, function(error) { console.log(error) });
