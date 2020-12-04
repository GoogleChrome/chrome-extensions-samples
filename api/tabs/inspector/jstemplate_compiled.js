/**
 * @fileoverview This file contains miscellaneous basic functionality.
 *
 */

/**
 * Creates a DOM element with the given tag name in the document of the
 * owner element.
 *
 * @param {String} tagName  The name of the tag to create.
 * @param {Element} owner The intended owner (i.e., parent element) of
 * the created element.
 * @param {Point} opt_position  The top-left corner of the created element.
 * @param {Size} opt_size  The size of the created element.
 * @param {Boolean} opt_noAppend Do not append the new element to the owner.
 * @return {Element}  The newly created element node.
 */
function createElement(tagName, owner, opt_position, opt_size, opt_noAppend) {
  var element = ownerDocument(owner).createElement(tagName);
  if (opt_position) {
    setPosition(element, opt_position);
  }
  if (opt_size) {
    setSize(element, opt_size);
  }
  if (owner && !opt_noAppend) {
    appendChild(owner, element);
  }

  return element;
}

/**
 * Creates a text node with the given value.
 *
 * @param {String} value  The text to place in the new node.
 * @param {Element} owner The owner (i.e., parent element) of the new
 * text node.
 * @return {Text}  The newly created text node.
 */
function createTextNode(value, owner) {
  var element = ownerDocument(owner).createTextNode(value);
  if (owner) {
    appendChild(owner, element);
  }
  return element;
}

/**
 * Returns the document owner of the given element. In particular,
 * returns window.document if node is null or the browser does not
 * support ownerDocument.
 *
 * @param {Node} node  The node whose ownerDocument is required.
 * @returns {Document|Null}  The owner document or null if unsupported.
 */
function ownerDocument(node) {
  return (node ? node.ownerDocument : null) || document;
}

/**
 * Wrapper function to create CSS units (pixels) string
 *
 * @param {Number} numPixels  Number of pixels, may be floating point.
 * @returns {String}  Corresponding CSS units string.
 */
function px(numPixels) {
  return round(numPixels) + "px";
}

/**
 * Sets the left and top of the given element to the given point.
 *
 * @param {Element} element  The dom element to manipulate.
 * @param {Point} point  The desired position.
 */
function setPosition(element, point) {
  var style = element.style;
  style.position = "absolute";
  style.left = px(point.x);
  style.top = px(point.y);
}

/**
 * Sets the width and height style attributes to the given size.
 *
 * @param {Element} element  The dom element to manipulate.
 * @param {Size} size  The desired size.
 */
function setSize(element, size) {
  var style = element.style;
  style.width = px(size.width);
  style.height = px(size.height);
}

/**
 * Sets display to none. Doing this as a function saves a few bytes for
 * the 'style.display' property and the 'none' literal.
 *
 * @param {Element} node  The dom element to manipulate.
 */
function displayNone(node) {
  node.style.display = 'none';
}

/**
 * Sets display to default.
 *
 * @param {Element} node  The dom element to manipulate.
 */
function displayDefault(node) {
  node.style.display = '';
}

/**
 * Appends the given child to the given parent in the DOM
 *
 * @param {Element} parent  The parent dom element.
 * @param {Node} child  The new child dom node.
 */
function appendChild(parent, child) {
  parent.appendChild(child);
}


/**
 * Wrapper for the eval() builtin function to evaluate expressions and
 * obtain their value. It wraps the expression in parentheses such
 * that object literals are really evaluated to objects. Without the
 * wrapping, they are evaluated as block, and create syntax
 * errors. Also protects against other syntax errors in the eval()ed
 * code and returns null if the eval throws an exception.
 *
 * @param {String} expr
 * @return {Object|Null}
 */
function jsEval(expr) {
  try {
    return eval('[' + expr + '][0]');
  } catch (e) {
    return null;
  }
}


/**
 * Wrapper for the eval() builtin function to execute statements. This
 * guards against exceptions thrown, but doesn't return a
 * value. Still, mostly for testability, it returns a boolean to
 * indicate whether execution was successful. NOTE:
 * javascript's eval semantics is murky in that it confounds
 * expression evaluation and statement execution into a single
 * construct. Cf. jsEval().
 *
 * @param {String} stmt
 * @return {Boolean}
 */
function jsExec(stmt) {
  try {
    eval(stmt);
    return true;
  } catch (e) {
    return false;
  }
}


/**
 * Wrapper for eval with a context. NOTE: The style guide
 * deprecates eval, so this is the exception that proves the
 * rule. Notice also that since the value of the expression is
 * returned rather than assigned to a local variable, one major
 * objection aganist the use of the with() statement, namely that
 * properties of the with() target override local variables of the
 * same name, is void here.
 *
 * @param {String} expr
 * @param {Object} context
 * @return {Object|Null}
 */
function jsEvalWith(expr, context) {
  try {
    with (context) {
      return eval('[' + expr + '][0]');
    }
  } catch (e) {
    return null;
  }
}


var DOM_ELEMENT_NODE = 1;
var DOM_ATTRIBUTE_NODE = 2;
var DOM_TEXT_NODE = 3;
var DOM_CDATA_SECTION_NODE = 4;
var DOM_ENTITY_REFERENCE_NODE = 5;
var DOM_ENTITY_NODE = 6;
var DOM_PROCESSING_INSTRUCTION_NODE = 7;
var DOM_COMMENT_NODE = 8;
var DOM_DOCUMENT_NODE = 9;
var DOM_DOCUMENT_TYPE_NODE = 10;
var DOM_DOCUMENT_FRAGMENT_NODE = 11;
var DOM_NOTATION_NODE = 12;

/**
 * Traverses the element nodes in the DOM tree underneath the given
 * node and finds the first node with elemId, or null if there is no such
 * element.  Traversal is in depth-first order.
 *
 * NOTE: The reason this is not combined with the elem() function is
 * that the implementations are different.
 * elem() is a wrapper for the built-in document.getElementById() function,
 * whereas this function performs the traversal itself.
 * Modifying elem() to take an optional root node is a possibility,
 * but the in-built function would perform better than using our own traversal.
 *
 * @param {Element} node Root element of subtree to traverse.
 * @param {String} elemId The id of the element to search for.
 * @return {Element|Null} The corresponding element, or null if not found.
 */
function nodeGetElementById(node, elemId) {
  for (var c = node.firstChild; c; c = c.nextSibling) {
    if (c.id == elemId) {
      return c;
    }
    if (c.nodeType == DOM_ELEMENT_NODE) {
      var n = arguments.callee.call(this, c, elemId);
      if (n) {
        return n;
      }
    }
  }
  return null;
}


/**
 * Get an attribute from the DOM.  Simple redirect, exists to compress code.
 *
 * @param {Element} node  Element to interrogate.
 * @param {String} name  Name of parameter to extract.
 * @return {String}  Resulting attribute.
 */
function domGetAttribute(node, name) {
  return node.getAttribute(name);
}

/**
 * Set an attribute in the DOM.  Simple redirect to compress code.
 *
 * @param {Element} node  Element to interrogate.
 * @param {String} name  Name of parameter to set.
 * @param {String} value  Set attribute to this value.
 */
function domSetAttribute(node, name, value) {
  node.setAttribute(name, value);
}

/**
 * Remove an attribute from the DOM.  Simple redirect to compress code.
 *
 * @param {Element} node  Element to interrogate.
 * @param {String} name  Name of parameter to remove.
 */
function domRemoveAttribute(node, name) {
  node.removeAttribute(name);
}

/**
 * Clone a node in the DOM.
 *
 * @param {Node} node  Node to clone.
 * @return {Node}  Cloned node.
 */
function domCloneNode(node) {
  return node.cloneNode(true);
}


/**
 * Return a safe string for the className of a node.
 * If className is not a string, returns "".
 *
 * @param {Element} node  DOM element to query.
 * @return {String}
 */
function domClassName(node) {
  return node.className ? "" + node.className : "";
}

/**
 * Adds a class name to the class attribute of the given node.
 *
 * @param {Element} node  DOM element to modify.
 * @param {String} className  Class name to add.
 */
function domAddClass(node, className) {
  var name = domClassName(node);
  if (name) {
    var cn = name.split(/\s+/);
    var found = false;
    for (var i = 0; i < jsLength(cn); ++i) {
      if (cn[i] == className) {
        found = true;
        break;
      }
    }

    if (!found) {
      cn.push(className);
    }

    node.className = cn.join(' ');
  } else {
    node.className = className;
  }
}

/**
 * Removes a class name from the class attribute of the given node.
 *
 * @param {Element} node  DOM element to modify.
 * @param {String} className  Class name to remove.
 */
function domRemoveClass(node, className) {
  var c = domClassName(node);
  if (!c || c.indexOf(className) == -1) {
    return;
  }
  var cn = c.split(/\s+/);
  for (var i = 0; i < jsLength(cn); ++i) {
    if (cn[i] == className) {
      cn.splice(i--, 1);
    }
  }
  node.className = cn.join(' ');
}

/**
 * Checks if a node belongs to a style class.
 *
 * @param {Element} node  DOM element to test.
 * @param {String} className  Class name to check for.
 * @return {Boolean}  Node belongs to style class.
 */
function domTestClass(node, className) {
  var cn = domClassName(node).split(/\s+/);
  for (var i = 0; i < jsLength(cn); ++i) {
    if (cn[i] == className) {
      return true;
    }
  }
  return false;
}

/**
 * Inserts a new child before a given sibling.
 *
 * @param {Node} newChild  Node to insert.
 * @param {Node} oldChild  Sibling node.
 * @return {Node}  Reference to new child.
 */
function domInsertBefore(newChild, oldChild) {
  return oldChild.parentNode.insertBefore(newChild, oldChild);
}

/**
 * Appends a new child to the specified (parent) node.
 *
 * @param {Element} node  Parent element.
 * @param {Node} child  Child node to append.
 * @return {Node}  Newly appended node.
 */
function domAppendChild(node, child) {
  return node.appendChild(child);
}

/**
 * Remove a new child from the specified (parent) node.
 *
 * @param {Element} node  Parent element.
 * @param {Node} child  Child node to remove.
 * @return {Node}  Removed node.
 */
function domRemoveChild(node, child) {
  return node.removeChild(child);
}

/**
 * Replaces an old child node with a new child node.
 *
 * @param {Node} newChild  New child to append.
 * @param {Node} oldChild  Old child to remove.
 * @return {Node}  Replaced node.
 */
function domReplaceChild(newChild, oldChild) {
  return oldChild.parentNode.replaceChild(newChild, oldChild);
}

/**
 * Removes a node from the DOM.
 *
 * @param {Node} node  The node to remove.
 * @return {Node}  The removed node.
 */
function domRemoveNode(node) {
  return domRemoveChild(node.parentNode, node);
}

/**
 * Creates a new text node in the given document.
 *
 * @param {Document} doc  Target document.
 * @param {String} text  Text composing new text node.
 * @return {Text}  Newly constructed text node.
 */
function domCreateTextNode(doc, text) {
  return doc.createTextNode(text);
}

/**
 * Creates a new node in the given document
 *
 * @param {Document} doc  Target document.
 * @param {String} name  Name of new element (i.e. the tag name)..
 * @return {Element}  Newly constructed element.
 */
function domCreateElement(doc, name) {
  return doc.createElement(name);
}

/**
 * Creates a new attribute in the given document.
 *
 * @param {Document} doc  Target document.
 * @param {String} name  Name of new attribute.
 * @return {Attr}  Newly constructed attribute.
 */
function domCreateAttribute(doc, name) {
  return doc.createAttribute(name);
}

/**
 * Creates a new comment in the given document.
 *
 * @param {Document} doc  Target document.
 * @param {String} text  Comment text.
 * @return {Comment}  Newly constructed comment.
 */
function domCreateComment(doc, text) {
  return doc.createComment(text);
}

/**
 * Creates a document fragment.
 *
 * @param {Document} doc  Target document.
 * @return {DocumentFragment}  Resulting document fragment node.
 */
function domCreateDocumentFragment(doc) {
  return doc.createDocumentFragment();
}

/**
 * Redirect to document.getElementById
 *
 * @param {Document} doc  Target document.
 * @param {String} id  Id of requested node.
 * @return {Element|Null}  Resulting element.
 */
function domGetElementById(doc, id) {
  return doc.getElementById(id);
}

/**
 * Redirect to window.setInterval
 *
 * @param {Window} win  Target window.
 * @param {Function} fun  Callback function.
 * @param {Number} time  Time in milliseconds.
 * @return {Object}  Contract id.
 */
function windowSetInterval(win, fun, time) {
  return win.setInterval(fun, time);
}

/**
 * Redirect to window.clearInterval
 *
 * @param {Window} win  Target window.
 * @param {object} id  Contract id.
 * @return {any}  NOTE: Return type unknown?
 */
function windowClearInterval(win, id) {
  return win.clearInterval(id);
}

/**
 * Determines whether one node is recursively contained in another.
 * @param parent The parent node.
 * @param child The node to look for in parent.
 * @return parent recursively contains child
 */
function containsNode(parent, child) {
  while (parent != child && child.parentNode) {
    child = child.parentNode;
  }
  return parent == child;
};
/**
 * @fileoverview This file contains javascript utility functions that
 * do not depend on anything defined elsewhere.
 *
 */

/**
 * Returns the value of the length property of the given object. Used
 * to reduce compiled code size.
 *
 * @param {Array | String} a  The string or array to interrogate.
 * @return {Number}  The value of the length property.
 */
function jsLength(a) {
  return a.length;
}

var min = Math.min;
var max = Math.max;
var ceil = Math.ceil;
var floor = Math.floor;
var round = Math.round;
var abs = Math.abs;

/**
 * Copies all properties from second object to the first.  Modifies to.
 *
 * @param {Object} to  The target object.
 * @param {Object} from  The source object.
 */
function copyProperties(to, from) {
  foreachin(from, function(p) {
    to[p] = from[p];
  });
}

/**
 * Iterates over the array, calling the given function for each
 * element.
 *
 * @param {Array} array
 * @param {Function} fn
 */
function foreach(array, fn) {
  var I = jsLength(array);
  for (var i = 0; i < I; ++i) {
    fn(array[i], i);
  }
}

/**
 * Safely iterates over all properties of the given object, calling
 * the given function for each property. If opt_all isn't true, uses
 * hasOwnProperty() to assure the property is on the object, not on
 * its prototype.
 *
 * @param {Object} object
 * @param {Function} fn
 * @param {Boolean} opt_all  If true, also iterates over inherited properties.
 */
function foreachin(object, fn, opt_all) {
  for (var i in object) {
    if (opt_all || !object.hasOwnProperty || object.hasOwnProperty(i)) {
      fn(i, object[i]);
    }
  }
}

/**
 * Appends the second array to the first, copying its elements.
 * Optionally only a slice of the second array is copied.
 *
 * @param {Array} a1  Target array (modified).
 * @param {Array} a2  Source array.
 * @param {Number} opt_begin  Begin of slice of second array (optional).
 * @param {Number} opt_end  End (exclusive) of slice of second array (optional).
 */
function arrayAppend(a1, a2, opt_begin, opt_end) {
  var i0 = opt_begin || 0;
  var i1 = opt_end || jsLength(a2);
  for (var i = i0; i < i1; ++i) {
    a1.push(a2[i]);
  }
}

/**
 * Trim whitespace from begin and end of string.
 *
 * @see testStringTrim();
 *
 * @param {String} str  Input string.
 * @return {String}  Trimmed string.
 */
function stringTrim(str) {
  return stringTrimRight(stringTrimLeft(str));
}

/**
 * Trim whitespace from beginning of string.
 *
 * @see testStringTrimLeft();
 *
 * @param {String} str  Input string.
 * @return {String}  Trimmed string.
 */
function stringTrimLeft(str) {
  return str.replace(/^\s+/, "");
}

/**
 * Trim whitespace from end of string.
 *
 * @see testStringTrimRight();
 *
 * @param {String} str  Input string.
 * @return {String}  Trimmed string.
 */
function stringTrimRight(str) {
  return str.replace(/\s+$/, "");
}

/**
 * Jscompiler wrapper for parseInt() with base 10.
 *
 * @param {String} s String repersentation of a number.
 *
 * @return {Number} The integer contained in s, converted on base 10.
 */
function parseInt10(s) {
  return parseInt(s, 10);
}
/**
 * @fileoverview A simple formatter to project JavaScript data into
 * HTML templates. The template is edited in place. I.e. in order to
 * instantiate a template, clone it from the DOM first, and then
 * process the cloned template. This allows for updating of templates:
 * If the templates is processed again, changed values are merely
 * updated.
 *
 * NOTE: IE DOM doesn't have importNode().
 *
 * NOTE: The property name "length" must not be used in input
 * data, see comment in jstSelect_().
 */


/**
 * Names of jstemplate attributes. These attributes are attached to
 * normal HTML elements and bind expression context data to the HTML
 * fragment that is used as template.
 */
var ATT_select = 'jsselect';
var ATT_instance = 'jsinstance';
var ATT_display = 'jsdisplay';
var ATT_values = 'jsvalues';
var ATT_eval = 'jseval';
var ATT_transclude = 'transclude';
var ATT_content = 'jscontent';


/**
 * Names of special variables defined by the jstemplate evaluation
 * context. These can be used in js expression in jstemplate
 * attributes.
 */
var VAR_index = '$index';
var VAR_this = '$this';


/**
 * Context for processing a jstemplate. The context contains a context
 * object, whose properties can be referred to in jstemplate
 * expressions, and it holds the locally defined variables.
 *
 * @param {Object} opt_data The context object. Null if no context.
 *
 * @param {Object} opt_parent The parent context, from which local
 * variables are inherited. Normally the context object of the parent
 * context is the object whose property the parent object is. Null for the
 * context of the root object.
 *
 * @constructor
 */
function JsExprContext(opt_data, opt_parent) {
  var me = this;

  /**
   * The local context of the input data in which the jstemplate
   * expressions are evaluated. Notice that this is usually an Object,
   * but it can also be a scalar value (and then still the expression
   * $this can be used to refer to it). Notice this can be a scalar
   * value, including undefined.
   *
   * @type {Object}
   */
  me.data_ = opt_data;

  /**
   * The context for variable definitions in which the jstemplate
   * expressions are evaluated. Other than for the local context,
   * which replaces the parent context, variable definitions of the
   * parent are inherited. The special variable $this points to data_.
   *
   * @type {Object}
   */
  me.vars_ = {};
  if (opt_parent) {
    copyProperties(me.vars_, opt_parent.vars_);
  }
  this.vars_[VAR_this] = me.data_;
}


/**
 * Evaluates the given expression in the context of the current
 * context object and the current local variables.
 *
 * @param {String} expr A javascript expression.
 *
 * @param {Element} template DOM node of the template.
 *
 * @return The value of that expression.
 */
JsExprContext.prototype.jseval = function(expr, template) {
  with (this.vars_) {
    with (this.data_) {
      try {
        return (function() {
          return eval('[' + expr + '][0]');
        }).call(template);
      } catch (e) {
        return null;
      }
    }
  }
}


/**
 * Clones the current context for a new context object. The cloned
 * context has the data object as its context object and the current
 * context as its parent context. It also sets the $index variable to
 * the given value. This value usually is the position of the data
 * object in a list for which a template is instantiated multiply.
 *
 * @param {Object} data The new context object.
 *
 * @param {Number} index Position of the new context when multiply
 * instantiated. (See implementation of jstSelect().)
 *
 * @return {JsExprContext}
 */
JsExprContext.prototype.clone = function(data, index) {
  var ret = new JsExprContext(data, this);
  ret.setVariable(VAR_index, index);
  if (this.resolver_) {
    ret.setSubTemplateResolver(this.resolver_);
  }
  return ret;
}


/**
 * Binds a local variable to the given value. If set from jstemplate
 * jsvalue expressions, variable names must start with $, but in the
 * API they only have to be valid javascript identifier.
 *
 * @param {String} name
 *
 * @param {Object} value
 */
JsExprContext.prototype.setVariable = function(name, value) {
  this.vars_[name] = value;
}


/**
 * Sets the function used to resolve the values of the transclude
 * attribute into DOM nodes. By default, this is jstGetTemplate(). The
 * value set here is inherited by clones of this context.
 *
 * @param {Function} resolver The function used to resolve transclude
 * ids into a DOM node of a subtemplate. The DOM node returned by this
 * function will be inserted into the template instance being
 * processed. Thus, the resolver function must instantiate the
 * subtemplate as necessary.
 */
JsExprContext.prototype.setSubTemplateResolver = function(resolver) {
  this.resolver_ = resolver;
}


/**
 * Resolves a sub template from an id. Used to process the transclude
 * attribute. If a resolver function was set using
 * setSubTemplateResolver(), it will be used, otherwise
 * jstGetTemplate().
 *
 * @param {String} id The id of the sub template.
 *
 * @return {Node} The root DOM node of the sub template, for direct
 * insertion into the currently processed template instance.
 */
JsExprContext.prototype.getSubTemplate = function(id) {
  return (this.resolver_ || jstGetTemplate).call(this, id);
}


/**
 * HTML template processor. Data values are bound to HTML templates
 * using the attributes transclude, jsselect, jsdisplay, jscontent,
 * jsvalues. The template is modifed in place. The values of those
 * attributes are JavaScript expressions that are evaluated in the
 * context of the data object fragment.
 *
 * @param {JsExprContext} context Context created from the input data
 * object.
 *
 * @param {Element} template DOM node of the template. This will be
 * processed in place. After processing, it will still be a valid
 * template that, if processed again with the same data, will remain
 * unchanged.
 */
function jstProcess(context, template) {
  var processor = new JstProcessor();
  processor.run_([ processor, processor.jstProcess_, context, template ]);
}


/**
 * Internal class used by jstemplates to maintain context.
 * NOTE: This is necessary to process deep templates in Safari
 * which has a relatively shallow stack.
 * @class
 */
function JstProcessor() {
}


/**
 * Runs the state machine, beginning with function "start".
 *
 * @param {Array} start The first function to run, in the form
 * [object, method, args ...]
 */
JstProcessor.prototype.run_ = function(start) {
  var me = this;

  me.queue_ = [ start ];
  while (jsLength(me.queue_)) {
    var f = me.queue_.shift();
    f[1].apply(f[0], f.slice(2));
  }
}


/**
 * Appends a function to be called later.
 * Analogous to calling that function on a subsequent line, or a subsequent
 * iteration of a loop.
 *
 * @param {Array} f  A function in the form [object, method, args ...]
 */
JstProcessor.prototype.enqueue_ = function(f) {
  this.queue_.push(f);
}


/**
 * Implements internals of jstProcess.
 *
 * @param {JsExprContext} context
 *
 * @param {Element} template
 */
JstProcessor.prototype.jstProcess_ = function(context, template) {
  var me = this;

  var transclude = domGetAttribute(template, ATT_transclude);
  if (transclude) {
    var tr = context.getSubTemplate(transclude);
    if (tr) {
      domReplaceChild(tr, template);
      me.enqueue_([ me, me.jstProcess_, context, tr ]);
    } else {
      domRemoveNode(template);
    }
    return;
  }

  var select = domGetAttribute(template, ATT_select);
  if (select) {
    me.jstSelect_(context, template, select);
    return;
  }

  var display = domGetAttribute(template, ATT_display);
  if (display) {
    if (!context.jseval(display, template)) {
      displayNone(template);
      return;
    }

    displayDefault(template);
  }


  var values = domGetAttribute(template, ATT_values);
  if (values) {
    me.jstValues_(context, template, values);
  }

  var expressions = domGetAttribute(template, ATT_eval);
  if (expressions) {
    foreach(expressions.split(/\s*;\s*/), function(expression) {
      expression = stringTrim(expression);
      if (jsLength(expression)) {
        context.jseval(expression, template);
      }
    });
  }

  var content = domGetAttribute(template, ATT_content);
  if (content) {
    me.jstContent_(context, template, content);

  } else {
    var childnodes = [];
    for (var i = 0; i < jsLength(template.childNodes); ++i) {
      if (template.childNodes[i].nodeType == DOM_ELEMENT_NODE) {
      me.enqueue_(
          [ me, me.jstProcess_, context, template.childNodes[i] ]);
      }
    }
  }
}


/**
 * Implements the jsselect attribute: evalutes the value of the
 * jsselect attribute in the current context, with the current
 * variable bindings (see JsExprContext.jseval()). If the value is an
 * array, the current template node is multiplied once for every
 * element in the array, with the array element being the context
 * object. If the array is empty, or the value is undefined, then the
 * current template node is dropped. If the value is not an array,
 * then it is just made the context object.
 *
 * @param {JsExprContext} context The current evaluation context.
 *
 * @param {Element} template The currently processed node of the template.
 *
 * @param {String} select The javascript expression to evaluate.
 *
 * @param {Function} process The function to continue processing with.
 */
JstProcessor.prototype.jstSelect_ = function(context, template, select) {
  var me = this;

  var value = context.jseval(select, template);
  domRemoveAttribute(template, ATT_select);

  var instance = domGetAttribute(template, ATT_instance);
  var instance_last = false;
  if (instance) {
    if (instance.charAt(0) == '*') {
      instance = parseInt10(instance.substr(1));
      instance_last = true;
    } else {
      instance = parseInt10(instance);
    }
  }

  var multiple = (value !== null &&
                  typeof value == 'object' &&
                  typeof value.length == 'number');
  var multiple_empty = (multiple && value.length == 0);

  if (multiple) {
    if (multiple_empty) {
      if (!instance) {
        domSetAttribute(template, ATT_select, select);
        domSetAttribute(template, ATT_instance, '*0');
        displayNone(template);
      } else {
        domRemoveNode(template);
      }

    } else {
      displayDefault(template);
      if (instance === null || instance === "" || instance === undefined ||
          (instance_last && instance < jsLength(value) - 1)) {
        var templatenodes = [];
        var instances_start = instance || 0;
        for (var i = instances_start + 1; i < jsLength(value); ++i) {
          var node = domCloneNode(template);
          templatenodes.push(node);
          domInsertBefore(node, template);
        }
        templatenodes.push(template);

        for (var i = 0; i < jsLength(templatenodes); ++i) {
          var ii = i + instances_start;
          var v = value[ii];
          var t = templatenodes[i];

          me.enqueue_([ me, me.jstProcess_, context.clone(v, ii), t ]);
          var instanceStr = (ii == jsLength(value) - 1 ? '*' : '') + ii;
          me.enqueue_(
              [ null, postProcessMultiple_, t, select, instanceStr ]);
        }

      } else if (instance < jsLength(value)) {
        var v = value[instance];

        me.enqueue_(
            [me, me.jstProcess_, context.clone(v, instance), template]);
        var instanceStr = (instance == jsLength(value) - 1 ? '*' : '')
                          + instance;
        me.enqueue_(
            [ null, postProcessMultiple_, template, select, instanceStr ]);
      } else {
        domRemoveNode(template);
      }
    }
  } else {
    if (value == null) {
      domSetAttribute(template, ATT_select, select);
      displayNone(template);
    } else {
      me.enqueue_(
          [ me, me.jstProcess_, context.clone(value, 0), template ]);
      me.enqueue_(
          [ null, postProcessSingle_, template, select ]);
    }
  }
}


/**
 * Sets ATT_select and ATT_instance following recursion to jstProcess.
 *
 * @param {Element} template  The template
 *
 * @param {String} select  The jsselect string
 *
 * @param {String} instanceStr  The new value for the jsinstance attribute
 */
function postProcessMultiple_(template, select, instanceStr) {
  domSetAttribute(template, ATT_select, select);
  domSetAttribute(template, ATT_instance, instanceStr);
}


/**
 * Sets ATT_select and makes the element visible following recursion to
 * jstProcess.
 *
 * @param {Element} template  The template
 *
 * @param {String} select  The jsselect string
 */
function postProcessSingle_(template, select) {
  domSetAttribute(template, ATT_select, select);
  displayDefault(template);
}


/**
 * Implements the jsvalues attribute: evaluates each of the values and
 * assigns them to variables in the current context (if the name
 * starts with '$', javascript properties of the current template node
 * (if the name starts with '.'), or DOM attributes of the current
 * template node (otherwise). Since DOM attribute values are always
 * strings, the value is coerced to string in the latter case,
 * otherwise it's the uncoerced javascript value.
 *
 * @param {JsExprContext} context Current evaluation context.
 *
 * @param {Element} template Currently processed template node.
 *
 * @param {String} valuesStr Value of the jsvalues attribute to be
 * processed.
 */
JstProcessor.prototype.jstValues_ = function(context, template, valuesStr) {
  var values = valuesStr.split(/\s*;\s*/);
  for (var i = 0; i < jsLength(values); ++i) {
    var colon = values[i].indexOf(':');
    if (colon < 0) {
      continue;
    }
    var label = stringTrim(values[i].substr(0, colon));
    var value = context.jseval(values[i].substr(colon + 1), template);

    if (label.charAt(0) == '$') {
      context.setVariable(label, value);

    } else if (label.charAt(0) == '.') {
      var nameSpaceLabel = label.substr(1).split('.');
      var nameSpaceObject = template;
      var nameSpaceDepth = jsLength(nameSpaceLabel);
      for (var j = 0, J = nameSpaceDepth - 1; j < J; ++j) {
        var jLabel = nameSpaceLabel[j];
        if (!nameSpaceObject[jLabel]) {
          nameSpaceObject[jLabel] = {};
        }
        nameSpaceObject = nameSpaceObject[jLabel];
      }
      nameSpaceObject[nameSpaceLabel[nameSpaceDepth - 1]] = value;
    } else if (label) {
      if (typeof value == 'boolean') {
        if (value) {
          domSetAttribute(template, label, label);
        } else {
          domRemoveAttribute(template, label);
        }
      } else {
        domSetAttribute(template, label, '' + value);
      }
    }
  }
}


/**
 * Implements the jscontent attribute. Evalutes the expression in
 * jscontent in the current context and with the current variables,
 * and assigns its string value to the content of the current template
 * node.
 *
 * @param {JsExprContext} context Current evaluation context.
 *
 * @param {Element} template Currently processed template node.
 *
 * @param {String} content Value of the jscontent attribute to be
 * processed.
 */
JstProcessor.prototype.jstContent_ = function(context, template, content) {
  var value = '' + context.jseval(content, template);
  if (template.innerHTML == value) {
    return;
  }
  while (template.firstChild) {
    domRemoveNode(template.firstChild);
  }
  var t = domCreateTextNode(ownerDocument(template), value);
  domAppendChild(template, t);
}


/**
 * Helps to implement the transclude attribute, and is the initial
 * call to get hold of a template from its ID.
 *
 * @param {String} name The ID of the HTML element used as template.
 *
 * @returns {Element} The DOM node of the template. (Only element
 * nodes can be found by ID, hence it's a Element.)
 */
function jstGetTemplate(name) {
  var section = domGetElementById(document, name);
  if (section) {
    var ret = domCloneNode(section);
    domRemoveAttribute(ret, 'id');
    return ret;
  } else {
    return null;
  }
}

window['jstGetTemplate'] = jstGetTemplate;
window['jstProcess'] = jstProcess;
window['JsExprContext'] = JsExprContext;
