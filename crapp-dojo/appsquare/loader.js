function ImageLoader(url) {
  this.url_ = url;
}

ImageLoader.prototype.loadInto = function(imageNode) {
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'blob';
  xhr.onload = function() {
    // TODO(mihaip): cache the response into a local filesystem.
    imageNode.src = window.webkitURL.createObjectURL(xhr.response);
  }
  xhr.open('GET', this.url_, true);
  xhr.send();
};
