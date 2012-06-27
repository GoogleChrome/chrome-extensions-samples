var demo = null;
console.debug = function() {};

window.addEventListener("load", function() {
  var connect = document.getElementById("connect");
  var address = document.getElementById("address");

  var echoClient = newEchoClient(address.value);
  connect.onclick = function(ev) {
    echoClient.disconnect();
    echoClient = newEchoClient(address.value);
  };
  address.onkeydown = function(ev) {
    if (ev.which == 13) {
      echoClient.disconnect();
      echoClient = newEchoClient(address.value);
    }
  };

  demo = new MCO();
  demo.init();
  demo.canvas.style.zIndex = 1;

  setInterval(function(){ 
    if (demo.objects.length < 100) {
      echoClient.sender();
    }
  }, 100);

  setInterval(function(){
    for (var i = 0; i < demo.objects.length; i++) {
      demo.objects[i].age += 0.5;
      demo.objects[i].size += 1;
      demo.objects[i].mass *= 1.1;
    }
  }, 500);
});

var newEchoClient = function(address) {
  var ec = new chromeNetworking.clients.udp.echoClient();
  ec.sender = attachSend(ec);
  var hostnamePort = address.split(":");
  var hostname = hostnamePort[0];
  var port = (hostnamePort[1] || 7) | 0;
  ec.connect(
    hostname, port,
    function() {
      console.log("Connected");
    }
  );
  return ec;
};

var attachSend = function(client) {
  var i = 1;
  return function(e) {
    var data = i;
    var obj = demo.addObject();
    i++;
    client.echo(data, function() {
      obj.age = 0;
      obj.size = 2;
      var d = Math.sqrt(obj.vx*obj.vx+obj.vy*obj.vy);
      if (d == 0) {
        obj.vy = -12;
      } else {
        obj.vx = obj.vx*12 / d;
        obj.vy = obj.vy*12 / d;
      }
      setTimeout(function() {obj.age = 10;},200);
    });
  };
};

