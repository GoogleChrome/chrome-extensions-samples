 var zoomTool = (function(container, webview) {
   var ZoomController = function(webview) {          
     this.setZoom = function(zoomValue) {
       zoomValue =Math.max( Math.min(zoomValue, 5), 0.25);
       webview.setZoom(zoomValue);
     }
   }
 }(containerElement, webviewElement));
