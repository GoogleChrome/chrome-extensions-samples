var exitTool = (function() {
  var containerElement = null;
  var browserInstance = null;
  var controller = null;
  var yes = null; no = null;
  function query(id) { return containerElement.querySelector(id);}
  var ExitController = function(container, browser) {
    containerElement = container;
    browserInstance = browser;
    controller = this;
    yes = query('#exit-yes');
    no = query('#exit-no');
    yes.onclick = function() {
      window.close();
    };
    no.onclick = deactivate;
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay-gray';
    document.body.appendChild(this.overlay);
  };

  ExitController.prototype.activate = function() {
    containerElement.style.display = 'block';
    this.overlay.style.display = 'block';
  };

  function deactivate() {
    containerElement.style.display = 'none';
    controller.overlay.style.display = 'none';
  };

  return {'ExitController': ExitController};

})();
