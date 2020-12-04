  var zoomTool = (function() {
  function qsel(id) {
    return containerElement.querySelector(id);
  }
  var containerElement = null;
  var browserInstance = null;
  var controller = null;
  var form = null, zoomIn = null, zoomOut = null, submit = null,
    zoomFactor = null;
  var ZoomController = function(container, browser) {
    containerElement = container;
    browserInstance = browser;
    form = qsel('#zoom-form');
    zoomFactor = qsel('#zoom-text');
    zoomIn = qsel('#zoom-in');
    zoomOut = qsel('#zoom-out');
    submit = qsel('#submit');
    containerElement.style.display = 'none';
    controller = this;
    initHandlers();
  };

  ZoomController.prototype.deactivate = function() {
    if (this.isVisible()) {
      this.toggleVisibility();
    }
  }

  function initHandlers() {
    zoomIn.addEventListener('click', increaseZoom);
    zoomOut.addEventListener('click', decreaseZoom);
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var zoomValue = zoomFactor.value;
      updateZoom(zoomValue);
    });
  }

  ZoomController.prototype.isVisible = function() {
    return containerElement.style.display === '-webkit-flex';
  }

  ZoomController.prototype.toggleVisibility = function() {
    if (containerElement.style.display === '-webkit-flex') {
      containerElement.style.display = 'none';
    } else {
      containerElement.style.display = '-webkit-flex';
      browserInstance.tabs.getSelected().webview.getZoom(function(factor) {
        zoomFactor.value = Number(factor.toFixed(6)).toString();
      });
      zoomFactor.select();
    }
  };

  function setZoomWithinLimits(value) {
    return Math.max(Math.min(value, 5.0), 0.25);
  }

  function increaseZoom() {
    var zoomValue = getNextPresetZoom(Number(zoomFactor.value));
    updateZoom(zoomValue.high);
  }

  function decreaseZoom() {
    var zoomValue = getNextPresetZoom(Number(zoomFactor.value));
    updateZoom(zoomValue.low);
  }

  function updateZoom(value) {
    zoomFactor.value = value;
    browserInstance.tabs.getSelected().webview.setZoom(
      Number(zoomFactor.value));
  }

  function getNextPresetZoom(zoomFactor) {
  var preset = [0.25, 0.33, 0.5, 0.67, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2,
                2.5, 3, 4, 5];
  var low = 0;
  var high = preset.length - 1;
  var mid;
  while (high - low > 1) {
    mid = Math.floor((high + low)/2);
    if (preset[mid] < zoomFactor) {
      low = mid;
    } else if (preset[mid] > zoomFactor) {
      high = mid;
    } else {
      return {low: preset[mid - 1], high: preset[mid + 1]};
    }
  }
  return {low: preset[low], high: preset[high]};
}
  return {'ZoomController': ZoomController};
})();
