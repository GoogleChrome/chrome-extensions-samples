 var zoomTool = function(container, webview) {
  var ZoomController = function() {
    this.form = document.createElement('form');
    this.zoomFactor = document.createElement('input');
    this.submit = document.createElement('input');
    this.zoomIn = document.createElement('button');
    this.zoomOut = document.createElement('button');
    this.zoomFactor.type = 'text';
    this.submit.type = 'submit';
    form.appendChild(zoomFactor);
    form.appendChild(submit);
    form.appendChild(zoomIn);
    form.appendChild(zoomOut);
    container.appendChild(form);
    this.initHandlers();
  };

  ZoomController.prototype.setVisibility = function(visible) {
    if (visible) {
      container.style.display = '--webkit-flex';
      zoomFactor.select();
    } else {
      container.style.display = 'none';
    }
  }
  ZoomController.prototype.initHandlers = function() {
    zoomIn.addEventListener('click', decreaseZoom);
    zoomOut.addEventListener('click', increaseZoom);
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      zoomFactor.value = String(setZoomWithinLimits(Number(zoomFactor.value)));
      webview.setZoom(Number(zoomFactor.value));
    }.bind(this));
  };

  function setZoomWithinLimits(value) {
    return Math.max(Math.min(value, 5.0), 0.25);
  }

  function increaseZoom() {
    this.zoomFactor.value = setZoomWithinLimits(Number(this.zoomFactor) + 0.25);
    webview.setZoom(Number(this.zoomFactor.value));
  }

  function decreaseZoom() {
    this.zoomFactor.value = setZoomWithinLimits(Number(this.zoomFactor) - 0.25);
    webview.setZoom(Number(this.zoomFactor.value));
  }

};
