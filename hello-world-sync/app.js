(function(){
  var output = document.getElementById('output');
  var input = document.getElementById('myValue');
  var form = document.querySelector('form');
  var logarea = document.querySelector('textarea');

  function log(str) {
    logarea.value=str+"\n"+logarea.value;
  }
  
  form.addEventListener('submit', function(ev) {
    var newValue=input.value;
    chrome.storage.sync.set({"myValue": newValue}, function() {
      log("setting myValue to "+newValue);
    });
    ev.preventDefault();
  });

  function valueChanged(newValue) {
    output.innerText = newValue;
    output.className="changed";
    window.setTimeout(function() {output.className="";}, 200);
    log("value myValue changed to "+newValue);
  }

  // For debugging purposes:
  function debugChanges(changes, namespace) {
    for (key in changes) {
      console.log('Storage change: key='+key+' value='+JSON.stringify(changes[key]));
    }
  }  

  chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes["myValue"]) {
      valueChanged(changes["myValue"].newValue);
    }
    debugChanges(changes, namespace);
  });

  chrome.storage.sync.get("myValue", function(val) {valueChanged(val.myValue)});

})();
