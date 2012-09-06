var spinnerDemoRunning = false;

document.getElementById('windows-demo').onclick = function() {
  opener.windowingApiDemo.launch();
};

document.getElementById('exit-fullscreen').onclick = function() {
  document.webkitCancelFullScreen();
};

var minimizeAndHideButton = function(e) {
  minimize()
  e.target.classList.toggle('hidden');
};

var minimize = function () { chrome.app.window.current().minimize(); };

document.getElementById("apis-slide").addEventListener("slideleave", function() {
  if (spinnerDemoRunning) {
    servo.shutDown();
    spinnerDemoRunning = false;
    document.getElementById('spinner-demo').classList.remove('visible')
    document.getElementById('technical-difficulties').classList.remove('visible');
  }
  document.getElementById('spinner-demo-button').classList.remove('hidden');
});

document.getElementById('offline-demo').onclick = minimize;
document.getElementById('programming-demo').onclick = minimize;
document.getElementById('security-demo').onclick = minimize;
document.getElementById('spinner-demo-button2').onclick = minimize;

document.getElementById('spinner-demo-button').onclick = function() {
  document.getElementById('spinner-demo-button').classList.add('hidden');
  if (!spinnerDemoRunning) {
    navigator.webkitGetUserMedia({video: true}, function(stream) {
      document.getElementById('camera-output').src =
          webkitURL.createObjectURL(stream);
      servo.init();
      spinnerDemoRunning = true;

      setTimeout(function() {
        document.getElementById('spinner-demo').classList.add('visible');
      }, 1000);
    }, function(e) {
      document.getElementById('technical-difficulties').classList.add('visible');
    });
  }
};
