var findTool = (function(container, webview) {
	function findText(text) {
	  webview.find(text);
	}
	var Finder = function() {
    this.form = container.querySelector('form');
    this.searchTextInput = container.querySelector('find-text');
    this.matchCaseSelection = container.querySelector('match-case');
    this.searchForward = container.querySelector('find-forward');
    this.searchBackward = container.querySelector('find-backward');
  }
  Finder.prototype.init = function() {

  }
}(containerElement, webviewElement));
