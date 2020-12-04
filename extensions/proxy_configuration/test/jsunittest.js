/*  Jsunittest, version 0.6.0
 *  (c) 2008 Dr Nic Williams
 *
 *  Jsunittest is freely distributable under
 *  the terms of an MIT-style license.
 *  For details, see the web site: http://jsunittest.rubyforge.org
 *
 *--------------------------------------------------------------------------*/

var JsUnitTest = {
  Version: '0.6.0',
};

var DrNicTest = {
  Unit: {},
  inspect: function(object) {
    try {
      if (typeof object == "undefined") return 'undefined';
      if (object === null) return 'null';
      if (typeof object == "string") {
        var useDoubleQuotes = arguments[1];
        var escapedString = this.gsub(object, /[\x00-\x1f\\]/, function(match) {
          var character = String.specialChar[match[0]];
          return character ? character : '\\u00' + match[0].charCodeAt().toPaddedString(2, 16);
        });
        if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
        return "'" + escapedString.replace(/'/g, '\\\'') + "'";
      };
      return String(object);
    } catch (e) {
      if (e instanceof RangeError) return '...';
      throw e;
    }
  },
  $: function(element) {
    if (arguments.length > 1) {
      for (var i = 0, elements = [], length = arguments.length; i < length; i++)
        elements.push(this.$(arguments[i]));
      return elements;
    }
    if (typeof element == "string")
      element = document.getElementById(element);
    return element;
  },
  gsub: function(source, pattern, replacement) {
    var result = '', match;
    replacement = arguments.callee.prepareReplacement(replacement);

    while (source.length > 0) {
      if (match = source.match(pattern)) {
        result += source.slice(0, match.index);
        result += DrNicTest.String.interpret(replacement(match));
        source  = source.slice(match.index + match[0].length);
      } else {
        result += source, source = '';
      }
    }
    return result;
  },
  scan: function(source, pattern, iterator) {
    this.gsub(source, pattern, iterator);
    return String(source);
  },
  escapeHTML: function(data) {
    return data.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  },
  arrayfromargs: function(args) {
    var myarray = new Array();
    var i;

    for (i=0;i<args.length;i++)
      myarray[i] = args[i];

    return myarray;
  },
  hashToSortedArray: function(hash) {
    var results = [];
    for (key in hash) {
      results.push([key, hash[key]]);
    }
    return results.sort();
  },
  flattenArray: function(array) {
    var results = arguments[1] || [];
    for (var i=0; i < array.length; i++) {
      var object = array[i];
      if (object != null && typeof object == "object" &&
        'splice' in object && 'join' in object) {
          this.flattenArray(object, results);
      } else {
        results.push(object);
      }
    };
    return results;
  },
  selectorMatch: function(expression, element) {
    var tokens = [];
    var patterns = {
      // combinators must be listed first
      // (and descendant needs to be last combinator)
      laterSibling: /^\s*~\s*/,
      child:        /^\s*>\s*/,
      adjacent:     /^\s*\+\s*/,
      descendant:   /^\s/,

      // selectors follow
      tagName:      /^\s*(\*|[\w\-]+)(\b|$)?/,
      id:           /^#([\w\-\*]+)(\b|$)/,
      className:    /^\.([\w\-\*]+)(\b|$)/,
      pseudo:
  /^:((first|last|nth|nth-last|only)(-child|-of-type)|empty|checked|(en|dis)abled|not)(\((.*?)\))?(\b|$|(?=\s|[:+~>]))/,
      attrPresence: /^\[((?:[\w]+:)?[\w]+)\]/,
      attr:         /\[((?:[\w-]*:)?[\w-]+)\s*(?:([!^$*~|]?=)\s*((['"])([^\4]*?)\4|([^'"][^\]]*?)))?\]/
    };

    var assertions = {
      tagName: function(element, matches) {
        return matches[1].toUpperCase() == element.tagName.toUpperCase();
      },

      className: function(element, matches) {
        return Element.hasClassName(element, matches[1]);
      },

      id: function(element, matches) {
        return element.id === matches[1];
      },

      attrPresence: function(element, matches) {
        return Element.hasAttribute(element, matches[1]);
      },

      attr: function(element, matches) {
        var nodeValue = Element.readAttribute(element, matches[1]);
        return nodeValue && operators[matches[2]](nodeValue, matches[5] || matches[6]);
      }
    };
    var e = this.expression, ps = patterns, as = assertions;
    var le, p, m;

    while (e && le !== e && (/\S/).test(e)) {
      le = e;
      for (var i in ps) {
        p = ps[i];
        if (m = e.match(p)) {
          // use the Selector.assertions methods unless the selector
          // is too complex.
          if (as[i]) {
            tokens.push([i, Object.clone(m)]);
            e = e.replace(m[0], '');
          }
        }
      }
    }

    var match = true, name, matches;
    for (var i = 0, token; token = tokens[i]; i++) {
      name = token[0], matches = token[1];
      if (!assertions[name](element, matches)) {
        match = false; break;
      }
    }

    return match;
  },
  toQueryParams: function(query, separator) {
    var query = query || window.location.search;
    var match = query.replace(/^\s+/, '').replace(/\s+$/, '').match(/([^?#]*)(#.*)?$/);
    if (!match) return { };

    var hash = {};
    var parts = match[1].split(separator || '&');
    for (var i=0; i < parts.length; i++) {
      var pair = parts[i].split('=');
      if (pair[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          var object = hash[key];
          var isArray = object != null && typeof object == "object" &&
            'splice' in object && 'join' in object
          if (!isArray) hash[key] = [hash[key]];
          hash[key].push(value);
        }
        else hash[key] = value;
      }
    };
    return hash;
  },

  String: {
    interpret: function(value) {
      return value == null ? '' : String(value);
    }
  }
};

DrNicTest.gsub.prepareReplacement = function(replacement) {
  if (typeof replacement == "function") return replacement;
  var template = new Template(replacement);
  return function(match) { return template.evaluate(match) };
};

DrNicTest.Template = function(template, pattern) {
  this.template = template; //template.toString();
  this.pattern = pattern || DrNicTest.Template.Pattern;
};

DrNicTest.Template.prototype.evaluate = function(object) {
  if (typeof object.toTemplateReplacements == "function")
    object = object.toTemplateReplacements();

  return DrNicTest.gsub(this.template, this.pattern, function(match) {
    if (object == null) return '';

    var before = match[1] || '';
    if (before == '\\') return match[2];

    var ctx = object, expr = match[3];
    var pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;
    match = pattern.exec(expr);
    if (match == null) return before;

    while (match != null) {
      var comp = (match[1].indexOf('[]') === 0) ? match[2].gsub('\\\\]', ']') : match[1];
      ctx = ctx[comp];
      if (null == ctx || '' == match[3]) break;
      expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
      match = pattern.exec(expr);
    }

    return before + DrNicTest.String.interpret(ctx);
  });
}

DrNicTest.Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;
DrNicTest.Event = {};
// written by Dean Edwards, 2005
// with input from Tino Zijdel, Matthias Miller, Diego Perini
// namespaced by Dr Nic Williams 2008

// http://dean.edwards.name/weblog/2005/10/add-event/
// http://dean.edwards.name/weblog/2005/10/add-event2/
DrNicTest.Event.addEvent = function(element, type, handler) {
  if (element.addEventListener) {
    element.addEventListener(type, handler, false);
  } else {
    // assign each event handler a unique ID
    if (!handler.$$guid) handler.$$guid = addEvent.guid++;
    // create a hash table of event types for the element
    if (!element.events) element.events = {};
    // create a hash table of event handlers for each element/event pair
    var handlers = element.events[type];
    if (!handlers) {
      handlers = element.events[type] = {};
      // store the existing event handler (if there is one)
      if (element["on" + type]) {
        handlers[0] = element["on" + type];
      }
    }
    // store the event handler in the hash table
    handlers[handler.$$guid] = handler;
    // assign a global event handler to do all the work
    element["on" + type] = handleEvent;
  }
};
// a counter used to create unique IDs
DrNicTest.Event.addEvent.guid = 1;

DrNicTest.Event.removeEvent = function(element, type, handler) {
  if (element.removeEventListener) {
    element.removeEventListener(type, handler, false);
  } else {
    // delete the event handler from the hash table
    if (element.events && element.events[type]) {
      delete element.events[type][handler.$$guid];
    }
  }
};

DrNicTest.Event.handleEvent = function(event) {
  var returnValue = true;
  // grab the event object (IE uses a global event object)
  event = event || fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
  // get a reference to the hash table of event handlers
  var handlers = this.events[event.type];
  // execute each event handler
  for (var i in handlers) {
    this.$$handleEvent = handlers[i];
    if (this.$$handleEvent(event) === false) {
      returnValue = false;
    }
  }
  return returnValue;
};

DrNicTest.Event.fixEvent = function(event) {
  // add W3C standard event methods
  event.preventDefault = fixEvent.preventDefault;
  event.stopPropagation = fixEvent.stopPropagation;
  return event;
};
DrNicTest.Event.fixEvent.preventDefault = function() {
  this.returnValue = false;
};
DrNicTest.Event.fixEvent.stopPropagation = function() {
  this.cancelBubble = true;
};

DrNicTest.Unit.Logger = function(element) {
  this.element = DrNicTest.$(element);
  if (this.element) this._createLogTable();
};

DrNicTest.Unit.Logger.prototype.start = function(testName) {
  if (!this.element) return;
  var tbody = this.element.getElementsByTagName('tbody')[0];
  tbody.innerHTML = tbody.innerHTML + '<tr><td>' + testName + '</td><td></td><td></td></tr>';
};

DrNicTest.Unit.Logger.prototype.setStatus = function(status) {
  var logline = this.getLastLogLine();
  logline.className = status;
  var statusCell = logline.getElementsByTagName('td')[1];
  statusCell.innerHTML = status;
};

DrNicTest.Unit.Logger.prototype.finish = function(status, summary) {
  if (!this.element) return;
  this.setStatus(status);
  this.message(summary);
};

DrNicTest.Unit.Logger.prototype.message = function(message) {
  if (!this.element) return;
  var cell = this.getMessageCell();
  cell.innerHTML = this._toHTML(message);
};

DrNicTest.Unit.Logger.prototype.summary = function(summary) {
  if (!this.element) return;
  var div = this.element.getElementsByTagName('div')[0];
  div.innerHTML = this._toHTML(summary);
};

DrNicTest.Unit.Logger.prototype.getLastLogLine = function() {
  var tbody = this.element.getElementsByTagName('tbody')[0];
  var loglines = tbody.getElementsByTagName('tr');
  return loglines[loglines.length - 1];
};

DrNicTest.Unit.Logger.prototype.getMessageCell = function() {
  var logline = this.getLastLogLine();
  return logline.getElementsByTagName('td')[2];
};

DrNicTest.Unit.Logger.prototype._createLogTable = function() {
  var html = '<div class="logsummary">running...</div>' +
  '<table class="logtable">' +
  '<thead><tr><th>Status</th><th>Test</th><th>Message</th></tr></thead>' +
  '<tbody class="loglines"></tbody>' +
  '</table>';
  this.element.innerHTML = html;
};

DrNicTest.Unit.Logger.prototype.appendActionButtons = function(actions) {
  // actions = $H(actions);
  // if (!actions.any()) return;
  // var div = new Element("div", {className: 'action_buttons'});
  // actions.inject(div, function(container, action) {
  //   var button = new Element("input").setValue(action.key).observe("click", action.value);
  //   button.type = "button";
  //   return container.insert(button);
  // });
  // this.getMessageCell().insert(div);
};

DrNicTest.Unit.Logger.prototype._toHTML = function(txt) {
  return DrNicTest.escapeHTML(txt).replace(/\n/g,"<br/>");
};
DrNicTest.Unit.MessageTemplate = function(string) {
  var parts = [];
  var str = DrNicTest.scan((string || ''), /(?=[^\\])\?|(?:\\\?|[^\?])+/, function(part) {
    parts.push(part[0]);
  });
  this.parts = parts;
};

DrNicTest.Unit.MessageTemplate.prototype.evaluate = function(params) {
  var results = [];
  for (var i=0; i < this.parts.length; i++) {
    var part = this.parts[i];
    var result = (part == '?') ? DrNicTest.inspect(params.shift()) : part.replace(/\\\?/, '?');
    results.push(result);
  };
  return results.join('');
};
// A generic function for performming AJAX requests
// It takes one argument, which is an object that contains a set of options
// All of which are outline in the comments, below
// From John Resig's book Pro JavaScript Techniques
// published by Apress, 2006-8
DrNicTest.ajax = function( options ) {

    // Load the options object with defaults, if no
    // values were provided by the user
    options = {
        // The type of HTTP Request
        type: options.type || "POST",

        // The URL the request will be made to
        url: options.url || "",

        // How long to wait before considering the request to be a timeout
        timeout: options.timeout || 5000,

        // Functions to call when the request fails, succeeds,
        // or completes (either fail or succeed)
        onComplete: options.onComplete || function(){},
        onError: options.onError || function(){},
        onSuccess: options.onSuccess || function(){},

        // The data type that'll be returned from the server
        // the default is simply to determine what data was returned from the
        // and act accordingly.
        data: options.data || ""
    };

    // Create the request object
    var xml = new XMLHttpRequest();

    // Open the asynchronous POST request
    xml.open(options.type, options.url, true);

    // We're going to wait for a request for 5 seconds, before giving up
    var timeoutLength = 5000;

    // Keep track of when the request has been succesfully completed
    var requestDone = false;

    // Initalize a callback which will fire 5 seconds from now, cancelling
    // the request (if it has not already occurred).
    setTimeout(function(){
         requestDone = true;
    }, timeoutLength);

    // Watch for when the state of the document gets updated
    xml.onreadystatechange = function(){
        // Wait until the data is fully loaded,
        // and make sure that the request hasn't already timed out
        if ( xml.readyState == 4 && !requestDone ) {

            // Check to see if the request was successful
            if ( httpSuccess( xml ) ) {

                // Execute the success callback with the data returned from the server
                options.onSuccess( httpData( xml, options.type ) );

            // Otherwise, an error occurred, so execute the error callback
            } else {
                options.onError();
            }

            // Call the completion callback
            options.onComplete();

            // Clean up after ourselves, to avoid memory leaks
            xml = null;
        }
    };

    // Establish the connection to the server
    xml.send();

    // Determine the success of the HTTP response
    function httpSuccess(r) {
        try {
            // If no server status is provided, and we're actually
            // requesting a local file, then it was successful
            return !r.status && location.protocol == "file:" ||

                // Any status in the 200 range is good
                ( r.status >= 200 && r.status < 300 ) ||

                // Successful if the document has not been modified
                r.status == 304 ||

                // Safari returns an empty status if the file has not been modified
                navigator.userAgent.indexOf("Safari") >= 0 && typeof r.status == "undefined";
        } catch(e){}

        // If checking the status failed, then assume that the request failed too
        return false;
    }

    // Extract the correct data from the HTTP response
    function httpData(r,type) {
        // Get the content-type header
        var ct = r.getResponseHeader("content-type");

        // If no default type was provided, determine if some
        // form of XML was returned from the server
        var data = !type && ct && ct.indexOf("xml") >= 0;

        // Get the XML Document object if XML was returned from
        // the server, otherwise return the text contents returned by the server
        data = type == "xml" || data ? r.responseXML : r.responseText;

        // If the specified type is "script", execute the returned text
        // response as if it was JavaScript
        if ( type == "script" )
            eval.call( window, data );

        // Return the response data (either an XML Document or a text string)
        return data;
    }

}
DrNicTest.Unit.Assertions = {
  buildMessage: function(message, template) {
    var args = DrNicTest.arrayfromargs(arguments).slice(2);
    return (message ? message + '\n' : '') +
      new DrNicTest.Unit.MessageTemplate(template).evaluate(args);
  },

  flunk: function(message) {
    this.assertBlock(message || 'Flunked', function() { return false });
  },

  assertBlock: function(message, block) {
    try {
      block.call(this) ? this.pass() : this.fail(message);
    } catch(e) { this.error(e) }
  },

  assert: function(expression, message) {
    message = this.buildMessage(message || 'assert', 'got <?>', expression);
    this.assertBlock(message, function() { return expression });
  },

  assertEqual: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertEqual', 'expected <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected == actual });
  },

  assertNotEqual: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertNotEqual', 'expected <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected != actual });
  },

  assertEnumEqual: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertEnumEqual', 'expected <?>, actual: <?>', expected, actual);
    var expected_array = DrNicTest.flattenArray(expected);
    var actual_array   = DrNicTest.flattenArray(actual);
    this.assertBlock(message, function() {
      if (expected_array.length == actual_array.length) {
        for (var i=0; i < expected_array.length; i++) {
          if (expected_array[i] != actual_array[i]) return false;
        };
        return true;
      }
      return false;
    });
  },

  assertEnumNotEqual: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertEnumNotEqual', '<?> was the same as <?>', expected, actual);
    var expected_array = DrNicTest.flattenArray(expected);
    var actual_array   = DrNicTest.flattenArray(actual);
    this.assertBlock(message, function() {
      if (expected_array.length == actual_array.length) {
        for (var i=0; i < expected_array.length; i++) {
          if (expected_array[i] != actual_array[i]) return true;
        };
        return false;
      }
      return true;
    });
  },

  assertHashEqual: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertHashEqual', 'expected <?>, actual: <?>', expected, actual);
    var expected_array = DrNicTest.flattenArray(DrNicTest.hashToSortedArray(expected));
    var actual_array   = DrNicTest.flattenArray(DrNicTest.hashToSortedArray(actual));
    var block = function() {
      if (expected_array.length == actual_array.length) {
        for (var i=0; i < expected_array.length; i++) {
          if (expected_array[i] != actual_array[i]) return false;
        };
        return true;
      }
      return false;
    };
    this.assertBlock(message, block);
  },

  assertHashNotEqual: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertHashNotEqual', '<?> was the same as <?>', expected, actual);
    var expected_array = DrNicTest.flattenArray(DrNicTest.hashToSortedArray(expected));
    var actual_array   = DrNicTest.flattenArray(DrNicTest.hashToSortedArray(actual));
    // from now we recursively zip & compare nested arrays
    var block = function() {
      if (expected_array.length == actual_array.length) {
        for (var i=0; i < expected_array.length; i++) {
          if (expected_array[i] != actual_array[i]) return true;
        };
        return false;
      }
      return true;
    };
    this.assertBlock(message, block);
  },

  assertIdentical: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertIdentical', 'expected <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected === actual });
  },

  assertNotIdentical: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertNotIdentical', 'expected <?>, actual: <?>', expected, actual);
    this.assertBlock(message, function() { return expected !== actual });
  },

  assertNull: function(obj, message) {
    message = this.buildMessage(message || 'assertNull', 'got <?>', obj);
    this.assertBlock(message, function() { return obj === null });
  },

  assertNotNull: function(obj, message) {
    message = this.buildMessage(message || 'assertNotNull', 'got <?>', obj);
    this.assertBlock(message, function() { return obj !== null });
  },

  assertUndefined: function(obj, message) {
    message = this.buildMessage(message || 'assertUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return typeof obj == "undefined" });
  },

  assertNotUndefined: function(obj, message) {
    message = this.buildMessage(message || 'assertNotUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return typeof obj != "undefined" });
  },

  assertNullOrUndefined: function(obj, message) {
    message = this.buildMessage(message || 'assertNullOrUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return obj == null });
  },

  assertNotNullOrUndefined: function(obj, message) {
    message = this.buildMessage(message || 'assertNotNullOrUndefined', 'got <?>', obj);
    this.assertBlock(message, function() { return obj != null });
  },

  assertMatch: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertMatch', 'regex <?> did not match <?>', expected, actual);
    this.assertBlock(message, function() { return new RegExp(expected).exec(actual) });
  },

  assertNoMatch: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertNoMatch', 'regex <?> matched <?>', expected, actual);
    this.assertBlock(message, function() { return !(new RegExp(expected).exec(actual)) });
  },

  assertHidden: function(element, message) {
    message = this.buildMessage(message || 'assertHidden', '? isn\'t hidden.', element);
    this.assertBlock(message, function() { return element.style.display == 'none' });
  },

  assertInstanceOf: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertInstanceOf', '<?> was not an instance of the expected type', actual);
    this.assertBlock(message, function() { return actual instanceof expected });
  },

  assertNotInstanceOf: function(expected, actual, message) {
    message = this.buildMessage(message || 'assertNotInstanceOf', '<?> was an instance of the expected type', actual);
    this.assertBlock(message, function() { return !(actual instanceof expected) });
  },

  assertRespondsTo: function(method, obj, message) {
    message = this.buildMessage(message || 'assertRespondsTo', 'object doesn\'t respond to <?>', method);
    this.assertBlock(message, function() { return (method in obj && typeof obj[method] == 'function') });
  },

  assertRaise: function(exceptionName, method, message) {
    message = this.buildMessage(message || 'assertRaise', '<?> exception expected but none was raised', exceptionName);
    var block = function() {
      try {
        method();
        return false;
      } catch(e) {
        if (e.name == exceptionName) return true;
        else throw e;
      }
    };
    this.assertBlock(message, block);
  },

  assertNothingRaised: function(method, message) {
    try {
      method();
      this.assert(true, "Expected nothing to be thrown");
    } catch(e) {
      message = this.buildMessage(message || 'assertNothingRaised', '<?> was thrown when nothing was expected.', e);
      this.flunk(message);
    }
  },

  _isVisible: function(element) {
    element = DrNicTest.$(element);
    if(!element.parentNode) return true;
    this.assertNotNull(element);
    if(element.style && element.style.display == 'none')
      return false;

    return arguments.callee.call(this, element.parentNode);
  },

  assertVisible: function(element, message) {
    message = this.buildMessage(message, '? was not visible.', element);
    this.assertBlock(message, function() { return this._isVisible(element) });
  },

  assertNotVisible: function(element, message) {
    message = this.buildMessage(message, '? was not hidden and didn\'t have a hidden parent either.', element);
    this.assertBlock(message, function() { return !this._isVisible(element) });
  },

  assertElementsMatch: function() {
    var pass = true, expressions = DrNicTest.arrayfromargs(arguments);
    var elements = expressions.shift();
    if (elements.length != expressions.length) {
      message = this.buildMessage('assertElementsMatch', 'size mismatch: ? elements, ? expressions (?).', elements.length, expressions.length, expressions);
      this.flunk(message);
      pass = false;
    }
    for (var i=0; i < expressions.length; i++) {
      var expression = expressions[i];
      var element    = DrNicTest.$(elements[i]);
      if (DrNicTest.selectorMatch(expression, element)) {
        pass = true;
        break;
      }
      message = this.buildMessage('assertElementsMatch', 'In index <?>: expected <?> but got ?', index, expression, element);
      this.flunk(message);
      pass = false;
    };
    this.assert(pass, "Expected all elements to match.");
  },

  assertElementMatches: function(element, expression, message) {
    this.assertElementsMatch([element], expression);
  }
};
DrNicTest.Unit.Runner = function(testcases) {
  var argumentOptions = arguments[1] || {};
  var options = this.options = {};
  options.testLog = ('testLog' in argumentOptions) ? argumentOptions.testLog : 'testlog';
  options.resultsURL = this.queryParams.resultsURL;
  options.testLog = DrNicTest.$(options.testLog);

  this.tests = this.getTests(testcases);
  this.currentTest = 0;
  this.logger = new DrNicTest.Unit.Logger(options.testLog);

  var self = this;
  DrNicTest.Event.addEvent(window, "load", function() {
    setTimeout(function() {
      self.runTests();
    }, 0.1);
  });
};

DrNicTest.Unit.Runner.prototype.queryParams = DrNicTest.toQueryParams();

DrNicTest.Unit.Runner.prototype.portNumber = function() {
  if (window.location.search.length > 0) {
    var matches = window.location.search.match(/\:(\d{3,5})\//);
    if (matches) {
      return parseInt(matches[1]);
    }
  }
  return null;
};

DrNicTest.Unit.Runner.prototype.getTests = function(testcases) {
  var tests = [], options = this.options;
  if (this.queryParams.tests) tests = this.queryParams.tests.split(',');
  else if (options.tests) tests = options.tests;
  else if (options.test) tests = [option.test];
  else {
    for (testname in testcases) {
      if (testname.match(/^test/)) tests.push(testname);
    }
  }
  var results = [];
  for (var i=0; i < tests.length; i++) {
    var test = tests[i];
    if (testcases[test])
      results.push(
        new DrNicTest.Unit.Testcase(test, testcases[test], testcases.setup, testcases.teardown)
      );
  };
  return results;
};

DrNicTest.Unit.Runner.prototype.getResult = function() {
  var results = {
    tests: this.tests.length,
    assertions: 0,
    failures: 0,
    errors: 0
  };

  for (var i=0; i < this.tests.length; i++) {
    var test = this.tests[i];
    results.assertions += test.assertions;
    results.failures   += test.failures;
    results.errors     += test.errors;
  };
  return results;
};

DrNicTest.Unit.Runner.prototype.postResults = function() {
  if (this.options.resultsURL) {
    // new Ajax.Request(this.options.resultsURL,
    //   { method: 'get', parameters: this.getResult(), asynchronous: false });
    var results = this.getResult();
    var url = this.options.resultsURL + "?";
    url += "assertions="+ results.assertions + "&";
    url += "failures="  + results.failures + "&";
    url += "errors="    + results.errors;
    DrNicTest.ajax({
      url: url,
      type: 'GET'
    })
  }
};

DrNicTest.Unit.Runner.prototype.runTests = function() {
  var test = this.tests[this.currentTest], actions;

  if (!test) return this.finish();
  if (!test.isWaiting) this.logger.start(test.name);
  test.run();
  var self = this;
  if(test.isWaiting) {
    this.logger.message("Waiting for " + test.timeToWait + "ms");
    // setTimeout(this.runTests.bind(this), test.timeToWait || 1000);
    setTimeout(function() {
      self.runTests();
    }, test.timeToWait || 1000);
    return;
  }

  this.logger.finish(test.status(), test.summary());
  if (actions = test.actions) this.logger.appendActionButtons(actions);
  this.currentTest++;
  // tail recursive, hopefully the browser will skip the stackframe
  this.runTests();
};

DrNicTest.Unit.Runner.prototype.finish = function() {
  this.postResults();
  this.logger.summary(this.summary());
};

DrNicTest.Unit.Runner.prototype.summary = function() {
  return new DrNicTest.Template('#{tests} tests, #{assertions} assertions, #{failures} failures, #{errors} errors').evaluate(this.getResult());
};
DrNicTest.Unit.Testcase = function(name, test, setup, teardown) {
  this.name           = name;
  this.test           = test     || function() {};
  this.setup          = setup    || function() {};
  this.teardown       = teardown || function() {};
  this.messages       = [];
  this.actions        = {};
};
// import DrNicTest.Unit.Assertions

for (method in DrNicTest.Unit.Assertions) {
  DrNicTest.Unit.Testcase.prototype[method] = DrNicTest.Unit.Assertions[method];
}

DrNicTest.Unit.Testcase.prototype.isWaiting  = false;
DrNicTest.Unit.Testcase.prototype.timeToWait = 1000;
DrNicTest.Unit.Testcase.prototype.assertions = 0;
DrNicTest.Unit.Testcase.prototype.failures   = 0;
DrNicTest.Unit.Testcase.prototype.errors     = 0;
// DrNicTest.Unit.Testcase.prototype.isRunningFromRake = window.location.port == 4711;
DrNicTest.Unit.Testcase.prototype.isRunningFromRake = window.location.port;

DrNicTest.Unit.Testcase.prototype.wait = function(time, nextPart) {
  this.isWaiting = true;
  this.test = nextPart;
  this.timeToWait = time;
};

DrNicTest.Unit.Testcase.prototype.run = function(rethrow) {
  try {
    try {
      if (!this.isWaiting) this.setup();
      this.isWaiting = false;
      this.test();
    } finally {
      if(!this.isWaiting) {
        this.teardown();
      }
    }
  }
  catch(e) {
    if (rethrow) throw e;
    this.error(e, this);
  }
};

DrNicTest.Unit.Testcase.prototype.summary = function() {
  var msg = '#{assertions} assertions, #{failures} failures, #{errors} errors\n';
  return new DrNicTest.Template(msg).evaluate(this) +
    this.messages.join("\n");
};

DrNicTest.Unit.Testcase.prototype.pass = function() {
  this.assertions++;
};

DrNicTest.Unit.Testcase.prototype.fail = function(message) {
  this.failures++;
  var line = "";
  try {
    throw new Error("stack");
  } catch(e){
    line = (/\.html:(\d+)/.exec(e.stack || '') || ['',''])[1];
  }
  this.messages.push("Failure: " + message + (line ? " Line #" + line : ""));
};

DrNicTest.Unit.Testcase.prototype.info = function(message) {
  this.messages.push("Info: " + message);
};

DrNicTest.Unit.Testcase.prototype.error = function(error, test) {
  this.errors++;
  this.actions['retry with throw'] = function() { test.run(true) };
  this.messages.push(error.name + ": "+ error.message + "(" + DrNicTest.inspect(error) + ")");
};

DrNicTest.Unit.Testcase.prototype.status = function() {
  if (this.failures > 0) return 'failed';
  if (this.errors > 0) return 'error';
  return 'passed';
};

DrNicTest.Unit.Testcase.prototype.benchmark = function(operation, iterations) {
  var startAt = new Date();
  (iterations || 1).times(operation);
  var timeTaken = ((new Date())-startAt);
  this.info((arguments[2] || 'Operation') + ' finished ' +
     iterations + ' iterations in ' + (timeTaken/1000)+'s' );
  return timeTaken;
};

Test = DrNicTest
