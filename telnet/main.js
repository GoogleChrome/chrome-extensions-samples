function toggleHelp() {
  document.querySelector('.help').classList.toggle('hidden');
  document.body.classList.toggle('dim');
}

(function() {
  var term = new Terminal('container');
  term.initFS(false, 1024 * 1024);

  document.body.addEventListener('keydown', function(e) {
    if (e.keyCode == 27) { // Esc
      toggleHelp();
      e.stopPropagation();
      e.preventDefault();
    }
  }, false);

  term.output('Press Esc for options.<br/>');

  // Make an ANSI Color converter.
  var ansiConv = new AnsiConverter();

  // Connect to aardmud by default.
  var host = 'aardmud.org';
  var port = 4000;
  connect(host, port);

  // Bind the connect dialog to real stuff.
  var button = document.getElementById('connect');
  button.addEventListener('click', function() {
    // Disconnect from previous socket.
    var host = document.getElementById('host').value;
    var port = parseInt(document.getElementById('port').value);
    tcpClient.disconnect();
    connect(host, port);
    toggleHelp();
  });

  function connect(host, port) {
    tcpClient = new TcpClient(host, port);
    tcpClient.connect(function() {
      term.output('Connected to ' + host + ':' + port + '<br/>');
      tcpClient.addResponseListener(function(data) {
        // Run response through ANSI colorizer.
        var formattedData = ansiConv.formatAnsi(data);
        // Split into multiple lines.
        var lines = formattedData.split('\n');
        // Render response in the terminal.
        var output = lines.join('<br/>');
        term.output(output);
      });
    });
  }

})();

