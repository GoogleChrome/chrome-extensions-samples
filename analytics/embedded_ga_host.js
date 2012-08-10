/**
 * Attached a proxy to the embedded iframe so that
 * any items to track in the master page are picked up
 * and sent over to the iframe. The iframe will then
 * send over the analytics data as normal
 */
(function(namespace) {
  function Proxy(bridge) {
    this.bridge = bridge;
  }

  Proxy.prototype.push = function(values) {
    this.bridge.postMessage(values, '*');
  };

  function installProxy() {
    var bridge = document.getElementById("embedded_ga").contentWindow;
    if (!bridge) {
      console.log("Cannot find embedded_ga element.");
      return;
    }

    var earlyEvents = [];
    if (namespace._gaq !== undefined) {
      earlyEvents = namespace._gaq;
    }

    namespace._gaq = new Proxy(bridge);
    for (var i in earlyEvents) {
      namespace._gaq.push(earlyEvents[i]);
    }
  }

  window.addEventListener('load', installProxy);
})(window);
