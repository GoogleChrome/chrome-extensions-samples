window.addEventListener('DOMContentLoaded', function() {
  var data = window.webkitIntent && window.webkitIntent.data || null;
  editor.initialize(data);
  window.webkitIntent = null;
});
