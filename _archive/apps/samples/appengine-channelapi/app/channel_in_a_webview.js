(function (exports) {

  function ChannelInAWebview(rootUrl) {
    this.webview = document.createElement('webview');
    this.webview.src = rootUrl+'/static/channel_in_a_webview.html';
    this.webview.style.width='0px';
    this.webview.style.height='0px';
    this.webview.style.display='none';
    this.webview.style.width='10px';
    this.webview.style.height='10px';
    this.webview.style.display='block';
    this.webview.style.border='1px solid red';
    document.body.appendChild(this.webview);

    this.onOpened = this.onMessage = null;

    window.addEventListener('message', function(e) {
      // sanity check for origin
      if ( this.webview.src.indexOf(e.origin)!=0 ) {
        console.error("Invalid origin of message, ignoring");
        return;
      }
      // onOpened event
      if ( this.onOpened && e.data && 'onOpened' in e.data ) {
        this.onOpened();
      }
      // onMessage event
      if ( this.onMessage && e.data && 'onMessage' in e.data ) {
        this.onMessage.call(this, e.data['onMessage']);
      }
    }.bind(this));
  }


  ChannelInAWebview.prototype._sendMessageToWebview = function(data) {
    this.webview.contentWindow.postMessage(data, this.webview.src);
  }

  ChannelInAWebview.prototype.openChannel = function(token) {
    this._sendMessageToWebview({'openChannel': token});
  }

  exports.ChannelInAWebview = ChannelInAWebview;

})(window);
