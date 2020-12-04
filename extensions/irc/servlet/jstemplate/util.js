// Copyright 2006 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
// implied. See the License for the specific language governing
// permissions and limitations under the License.
/**
 * @fileoverview Miscellaneous constants and functions referenced in
 * the main source files.
 *
 * @author Steffen Meschkat (mesch@google.com)
 */

var MAPS_DEBUG = false;

function log(msg) {}

// String literals defined globally and not to be inlined. (IE6 perf)
/** @const */ var STRING_empty = '';

/** @const */ var CSS_display = 'display';
/** @const */ var CSS_position = 'position';

// Constants for possible values of the typeof operator.
var TYPE_boolean = 'boolean';
var TYPE_number = 'number';
var TYPE_object = 'object';
var TYPE_string = 'string';
var TYPE_function = 'function';
var TYPE_undefined = 'undefined';


/**
 * Wrapper for the eval() builtin function to evaluate expressions and
 * obtain their value. It wraps the expression in parentheses such
 * that object literals are really evaluated to objects. Without the
 * wrapping, they are evaluated as block, and create syntax
 * errors. Also protects against other syntax errors in the eval()ed
 * code and returns null if the eval throws an exception.
 *
 * @param {string} expr
 * @return {Object|null}
 */
function jsEval(expr) {
  try {
    // NOTE(mesch): An alternative idiom would be:
    //
    //   eval('(' + expr + ')');
    //
    // Note that using the square brackets as below, "" evals to undefined.
    // The alternative of using parentheses does not work when evaluating
    // function literals in IE.
    // e.g. eval("(function() {})") returns undefined, and not a function
    // object, in IE.
    return eval('[' + expr + '][0]');
  } catch (e) {
    log('EVAL FAILED ' + expr + ': ' + e);
    return null;
  }
}

function jsLength(obj) {
  return obj.length;
}

function assert(obj) {}

/**
 * Copies all properties from second object to the first.  Modifies to.
 *
 * @param {Object} to  The target object.
 * @param {Object} from  The source object.
 */
function copyProperties(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
}


/**
 * @param {Object|null|undefined} value The possible value to use.
 * @param {Object} defaultValue The default if the value is not set.
 * @return {Object} The value, if it is
 * defined and not null; otherwise the default
 */
function getDefaultObject(value, defaultValue) {
  if (typeof value != TYPE_undefined && value != null) {
    return /** @type Object */(value);
  } else {
    return defaultValue;
  }
}

/**
 * Detect if an object looks like an Array.
 * Note that instanceof Array is not robust; for example an Array
 * created in another iframe fails instanceof Array.
 * @param {Object|null} value Object to interrogate
 * @return {boolean} Is the object an array?
 */
function isArray(value) {
  return value != null &&
      typeof value == TYPE_object &&
      typeof value.length == TYPE_number;
}


/**
 * Finds a slice of an array.
 *
 * @param {Array} array  Array to be sliced.
 * @param {number} start  The start of the slice.
 * @param {number} opt_end  The end of the slice (optional).
 * @return {Array} array  The slice of the array from start to end.
 */
function arraySlice(array, start, opt_end) {
  // Use
  //   return Function.prototype.call.apply(Array.prototype.slice, arguments);
  // instead of the simpler
  //   return Array.prototype.slice.call(array, start, opt_end);
  // here because of a bug in the FF and IE implementations of
  // Array.prototype.slice which causes this function to return an empty list
  // if opt_end is not provided.
  return Function.prototype.call.apply(Array.prototype.slice, arguments);
}


/**
 * Jscompiler wrapper for parseInt() with base 10.
 *
 * @param {string} s string repersentation of a number.
 *
 * @return {number} The integer contained in s, converted on base 10.
 */
function parseInt10(s) {
  return parseInt(s, 10);
}


/**
 * Clears the array by setting the length property to 0. This usually
 * works, and if it should turn out not to work everywhere, here would
 * be the place to implement the browser specific workaround.
 *
 * @param {Array} array  Array to be cleared.
 */
function arrayClear(array) {
  array.length = 0;
}


/**
 * Prebinds "this" within the given method to an object, but ignores all 
 * arguments passed to the resulting function.
 * I.e. var_args are all the arguments that method is invoked with when
 * invoking the bound function.
 *
 * @param {Object|null} object  The object that the method call targets.
 * @param {Function} method  The target method.
 * @return {Function}  Method with the target object bound to it and curried by
 *                     the provided arguments.
 */
function bindFully(object, method, var_args) {
  var args = arraySlice(arguments, 2);
  return function() {
    return method.apply(object, args);
  }
}

// Based on <http://www.w3.org/TR/2000/ REC-DOM-Level-2-Core-20001113/
// core.html#ID-1950641247>.
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



function domGetElementById(document, id) {
  return document.getElementById(id);
}

/**
 * Creates a new node in the given document
 *
 * @param {Document} doc  Target document.
 * @param {string} name  Name of new element (i.e. the tag name)..
 * @return {Element}  Newly constructed element.
 */
function domCreateElement(doc, name) {
  return doc.createElement(name);
}

/**
 * Traverses the element nodes in the DOM section underneath the given
 * node and invokes the given callback as a method on every element
 * node encountered.
 *
 * @param {Element} node  Parent element of the subtree to traverse.
 * @param {Function} callback  Called on each node in the traversal.
 */
function domTraverseElements(node, callback) {
  var traverser = new DomTraverser(callback);
  traverser.run(node);
}

/**
 * A class to hold state for a dom traversal.
 * @param {Function} callback  Called on each node in the traversal.
 * @constructor
 * @class
 */
function DomTraverser(callback) {
  this.callback_ = callback;
}

/**
 * Processes the dom tree in breadth-first order.
 * @param {Element} root  The root node of the traversal.
 */
DomTraverser.prototype.run = function(root) {
  var me = this;
  me.queue_ = [ root ];
  while (jsLength(me.queue_)) {
    me.process_(me.queue_.shift());
  }
}

/**
 * Processes a single node.
 * @param {Element} node  The current node of the traversal.
 */
DomTraverser.prototype.process_ = function(node) {
  var me = this;

  me.callback_(node);

  for (var c = node.firstChild; c; c = c.nextSibling) {
    if (c.nodeType == DOM_ELEMENT_NODE) {
      me.queue_.push(c);
    }
  }
}

/**
 * Get an attribute from the DOM.  Simple redirect, exists to compress code.
 *
 * @param {Element} node  Element to interrogate.
 * @param {string} name  Name of parameter to extract.
 * @return {string|null}  Resulting attribute.
 */
function domGetAttribute(node, name) {
  return node.getAttribute(name);
  // NOTE(mesch): Neither in IE nor in Firefox, HTML DOM attributes
  // implement namespaces. All items in the attribute collection have
  // null localName and namespaceURI attribute values. In IE, we even
  // encounter DIV elements that don't implement the method
  // getAttributeNS().
}


/**
 * Set an attribute in the DOM.  Simple redirect to compress code.
 *
 * @param {Element} node  Element to interrogate.
 * @param {string} name  Name of parameter to set.
 * @param {string|number} value  Set attribute to this value.
 */
function domSetAttribute(node, name, value) {
  node.setAttribute(name, value);
}

/**
 * Remove an attribute from the DOM.  Simple redirect to compress code.
 *
 * @param {Element} node  Element to interrogate.
 * @param {string} name  Name of parameter to remove.
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
  // NOTE(mesch): we never so far wanted to use cloneNode(false),
  // hence the default.
}

/**
 * Clone a element in the DOM.
 *
 * @param {Element} element  Element to clone.
 * @return {Element}  Cloned element.
 */
function domCloneElement(element) {
  return /** @type {Element} */(domCloneNode(element));
}

/**
 * Returns the document owner of the given element. In particular,
 * returns window.document if node is null or the browser does not
 * support ownerDocument.  If the node is a document itself, returns
 * itself.
 *
 * @param {Node|null|undefined} node  The node whose ownerDocument is required.
 * @returns {Document}  The owner document or window.document if unsupported.
 */
function ownerDocument(node) {
  if (!node) {
    return document;
  } else if (node.nodeType == DOM_DOCUMENT_NODE) {
    return /** @type Document */(node);
  } else {
    return node.ownerDocument || document;
  }
}

/**
 * Creates a new text node in the given document.
 *
 * @param {Document} doc  Target document.
 * @param {string} text  Text composing new text node.
 * @return {Text}  Newly constructed text node.
 */
function domCreateTextNode(doc, text) {
  return doc.createTextNode(text);
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
 * Sets display to default.
 *
 * @param {Element} node  The dom element to manipulate.
 */
function displayDefault(node) {
  node.style[CSS_display] = '';
}

/**
 * Sets display to none. Doing this as a function saves a few bytes for
 * the 'style.display' property and the 'none' literal.
 *
 * @param {Element} node  The dom element to manipulate.
 */
function displayNone(node) {
  node.style[CSS_display] = 'none';
}


/**
 * Sets position style attribute to absolute.
 *
 * @param {Element} node  The dom element to manipulate.
 */
function positionAbsolute(node) {
  node.style[CSS_position] = 'absolute';
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
 * Remove a child from the specified (parent) node.
 *
 * @param {Element} node  Parent element.
 * @param {Node} child  Child node to remove.
 * @return {Node}  Removed node.
 */
function domRemoveChild(node, child) {
  return node.removeChild(child);
}


/**
 * Trim whitespace from begin and end of string.
 *
 * @see testStringTrim();
 *
 * @param {string} str  Input string.
 * @return {string}  Trimmed string.
 */
function stringTrim(str) {
  return stringTrimRight(stringTrimLeft(str));
}

/**
 * Trim whitespace from beginning of string.
 *
 * @see testStringTrimLeft();
 *
 * @param {string} str  Input string.
 * @return {string}  Trimmed string.
 */
function stringTrimLeft(str) {
  return str.replace(/^\s+/, "");
}

/**
 * Trim whitespace from end of string.
 *
 * @see testStringTrimRight();
 *
 * @param {string} str  Input string.
 * @return {string}  Trimmed string.
  */
function stringTrimRight(str) {
  return str.replace(/\s+$/, "");
}