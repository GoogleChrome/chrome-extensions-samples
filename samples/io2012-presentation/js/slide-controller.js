(function(window) {

var ORIGIN_ = location.protocol + '//' + location.host;

function SlideController() {
  this.popup = null;
  this.isPopup = window.opener;

  if (this.setupDone()) {
    window.addEventListener('message', this.onMessage_.bind(this), false);
  }
}

SlideController.prototype.setupDone = function() {
  return true;
}

SlideController.prototype.onMessage_ = function(e) {
  var data = e.data;

  // Restrict messages to being from this origin. Allow local developmet
  // from file:// though.
  // TODO: It would be dope if FF implemented location.origin!
  if (e.origin != ORIGIN_ && ORIGIN_.indexOf('file://') != 0) {
    alert('Someone tried to postMessage from an unknown origin');
    return;
  }

  // if (e.source.location.hostname != 'localhost') {
  //   alert('Someone tried to postMessage from an unknown origin');
  //   return;
  // }

  if ('keyCode' in data) {
    var evt = document.createEvent('Event');
    evt.initEvent('keydown', true, true);
    evt.keyCode = data.keyCode;
    document.dispatchEvent(evt);
  }
};

SlideController.prototype.sendMsg = function(msg) {
  // // Send message to popup window.
  // if (this.popup) {
  //   this.popup.postMessage(msg, ORIGIN_);
  // }

  // Send message to main window.
  if (this.isPopup) {
    // TODO: It would be dope if FF implemented location.origin.
    window.opener.postMessage(msg, '*');
  }
};

window.SlideController = SlideController;

})(window);

