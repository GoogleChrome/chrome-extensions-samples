onload = function() {
  function update() {
    ['screenX', 'screenY', 'innerWidth', 'innerHeight'].forEach(function(prop) {
      document.getElementById(prop).innerText = window[prop];
    });

    webkitRequestAnimationFrame(update);
  }

  update();

  var minimizeNode = document.getElementById('minimize-button');
  if (minimizeNode) {
    minimizeNode.onclick = function() {
      opener.windowingApiDemo.minimizeAll();
    };
  }

  var closeNode = document.getElementById('close');
  if (closeNode) {
    closeNode.onclick = function() {
      window.close();
    };
  }
}
