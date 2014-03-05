/*
Copyright 2012 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Author: Renato Mangini (mangini@chromium.org)
*/

(function(exports) {

  function Commands() {
  	this.commands={};
  }

  Commands.prototype.addCommand=function(name, help, runnable) {
  	if (name in this.commands) {
  		console.log("WARNING: ignoring duplicate command "+name);
  		return;
  	}
  	this.commands[name] = {help: help, runnable: runnable};
  }

  Commands.prototype.help=function(name, args) {
    var result='';
    for (var command in this.commands) {
      result+=command+'\t'+this.commands[command].help+"\n";
    }
    return result;
  	/*if (! (name in this.commands)) {
  		return "Unknown command "+name;
  	}
  	var context={out: out};
  	return this.commands[name].help.apply(context, args);*/
  }

  Commands.prototype.run=function(name, args) {
    if (name === 'help') {
      return this.help(name, args);
    }
  	if (! (name in this.commands)) {
  		throw 'Unknown command '+name+'. Try "help"';
  	}
  	var context={};
  	return this.commands[name].runnable.call(context, args);
  }

  exports.Commands=new Commands();

})(window);


Commands.addCommand("echo", 
	"Echo the arguments", 
	function(args) {
		return args.join(' ');
	});

Commands.addCommand("open", 
  "Open the given URL", 
  function(args) {
    chrome.app.window.create('commands/webview.html', {bounds: {width: 600, height: 400}},
      function(w) {
        w.contentWindow.addEventListener("DOMContentLoaded", function() {
          var doc=w.contentWindow.document;
          var el=doc.querySelector("webview");
          el.src=args[0];
        });
      });
    return "ok, url "+args[0]+" open";
  });
