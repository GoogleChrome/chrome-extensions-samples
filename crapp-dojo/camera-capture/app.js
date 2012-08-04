function getCamera() {
	navigator.webkitGetUserMedia({audio: true, video: true}, function(stream) {
	  document.querySelector('video').src = webkitURL.createObjectURL(stream);
  }, function(e) {
  	console.error(e);
  });
}

document.querySelector('button').addEventListener('click', function(e) {
	getCamera();
});
