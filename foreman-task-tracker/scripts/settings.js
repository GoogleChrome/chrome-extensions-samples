var parent;
onload = function() {
  parent = window.opener;
  $('#reset-button').click(function() {
    parent.loadSampleModel('reset');
  });
  $('#empty-button').click(function() {
    parent.modelReset({context:[]});
  });
  $('#dump-button').click(function() {
    $('#dump').text(JSON.stringify(parent.model, null, 2));
  });
  $('#load-regex-button').click(function() {
    $('#dump').text(JSON.stringify(parent.foreman.regex, null, 2));
  })
}
