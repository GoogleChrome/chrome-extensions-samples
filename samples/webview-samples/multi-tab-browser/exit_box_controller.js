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
    var curr_focus = 'no';
    yes.onclick = function() {
      window.close();
    };
    no.onclick = deactivate;
    this.overlay = document.createElement('div');
    this.overlay.className = 'overlay-gray';
    document.body.appendChild(this.overlay);
    containerElement.onkeydown = function(e) {
      if (containerElement.style.display === 'none') {
        return;
      }
      e.preventDefault();
      if (e.keyCode === 9) {
        if (curr_focus === 'no') {
          curr_focus = 'yes';
          yes.focus();
        } else {
          curr_focus = 'no';
          no.focus();
        }
      } else if (e.keyCode === 13) {
        if (curr_focus === 'yes') {
          window.close();
        } else {
          deactivate();
        }
      }
    };
  };

  ExitController.prototype.activate = function() {
    containerElement.style.display = 'block';
    this.overlay.style.display = 'block';
    curr_focus = 'no';
    no.focus();
  };

  function deactivate() {
    containerElement.style.display = 'none';
    controller.overlay.style.display = 'none';
    yes.tabIndex = -1;
    no.tabIndex = -1;
  }

  return {'ExitController': ExitController};

})();
