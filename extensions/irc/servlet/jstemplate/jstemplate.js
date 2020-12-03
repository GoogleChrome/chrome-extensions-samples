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
 * Author: Steffen Meschkat <mesch@google.com>
 *
 * @fileoverview A simple formatter to project JavaScript data into
 * HTML templates. The template is edited in place. I.e. in order to
 * instantiate a template, clone it from the DOM first, and then
 * process the cloned template. This allows for updating of templates:
 * If the templates is processed again, changed values are merely
 * updated.
 *
 * NOTE(mesch): IE DOM doesn't have importNode().
 *
 * NOTE(mesch): The property name "length" must not be used in input
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
var ATT_vars = 'jsvars';
var ATT_eval = 'jseval';
var ATT_transclude = 'transclude';
var ATT_content = 'jscontent';
var ATT_skip = 'jsskip';


/**
 * Name of the attribute that caches a reference to the parsed
 * template processing attribute values on a template node.
 */
var ATT_jstcache = 'jstcache';


/**
 * Name of the property that caches the parsed template processing
 * attribute values on a template node.
 */
var PROP_jstcache = '__jstcache';


/**
 * ID of the element that contains dynamically loaded jstemplates.
 */
var STRING_jsts = 'jsts';


/**
 * Un-inlined string literals, to avoid object creation in
 * IE6.
 */
var CHAR_asterisk = '*';
var CHAR_dollar = '$';
var CHAR_period = '.';
var CHAR_ampersand = '&';
var STRING_div = 'div';
var STRING_id = 'id';
var STRING_asteriskzero = '*0';
var STRING_zero = '0';


/**
 * HTML template processor. Data values are bound to HTML templates
 * using the attributes transclude, jsselect, jsdisplay, jscontent,
 * jsvalues. The template is modifed in place. The values of those
 * attributes are JavaScript expressions that are evaluated in the
 * context of the data object fragment.
 *
 * @param {JsEvalContext} context Context created from the input data
 * object.
 *
 * @param {Element} template DOM node of the template. This will be
 * processed in place. After processing, it will still be a valid
 * template that, if processed again with the same data, will remain
 * unchanged.
 *
 * @param {boolean} opt_debugging Optional flag to collect debugging
 *     information while processing the template.  Only takes effect
 *     in MAPS_DEBUG.
 */
function jstProcess(context, template, opt_debugging) {
  var processor = new JstProcessor;
  if (MAPS_DEBUG && opt_debugging) {
    processor.setDebugging(opt_debugging);
  }
  JstProcessor.prepareTemplate_(template);

  /**
   * Caches the document of the template node, so we don't have to
   * access it through ownerDocument.
   * @type Document
   */
  processor.document_ = ownerDocument(template);

  processor.run_(bindFully(processor, processor.jstProcessOuter_,
                           context, template));
  if (MAPS_DEBUG && opt_debugging) {
    log('jstProcess:' + '\n' + processor.getLogs().join('\n'));
  }
}


/**
 * Internal class used by jstemplates to maintain context.  This is
 * necessary to process deep templates in Safari which has a
 * relatively shallow maximum recursion depth of 100.
 * @class
 * @constructor
 */
function JstProcessor() {
  if (MAPS_DEBUG) {
    /**
     * An array of logging messages.  These are collected during processing
     * and dumped to the console at the end.
     * @type Array<string>
     */
    this.logs_ = [];
  }
}


/**
 * Counter to generate node ids. These ids will be stored in
 * ATT_jstcache and be used to lookup the preprocessed js attributes
 * from the jstcache_. The id is stored in an attribute so it
 * suvives cloneNode() and thus cloned template nodes can share the
 * same cache entry.
 * @type number
 */
JstProcessor.jstid_ = 0;


/**
 * Map from jstid to processed js attributes.
 * @type Object
 */
JstProcessor.jstcache_ = {};

/**
 * The neutral cache entry. Used for all nodes that don't have any
 * jst attributes. We still set the jsid attribute on those nodes so
 * we can avoid to look again for all the other jst attributes that
 * aren't there. Remember: not only the processing of the js
 * attribute values is expensive and we thus want to cache it. The
 * access to the attributes on the Node in the first place is
 * expensive too.
 */
JstProcessor.jstcache_[0] = {};


/**
 * Map from concatenated attribute string to jstid.
 * The key is the concatenation of all jst atributes found on a node
 * formatted as "name1=value1&name2=value2&...", in the order defined by
 * JST_ATTRIBUTES. The value is the id of the jstcache_ entry that can
 * be used for this node. This allows the reuse of cache entries in cases
 * when a cached entry already exists for a given combination of attribute
 * values. (For example when two different nodes in a template share the same
 * JST attributes.)
 * @type Object
 */
JstProcessor.jstcacheattributes_ = {};


/**
 * Map for storing temporary attribute values in prepareNode_() so they don't
 * have to be retrieved twice. (IE6 perf)
 * @type Object
 */
JstProcessor.attributeValues_ = {};


/**
 * A list for storing non-empty attributes found on a node in prepareNode_().
 * The array is global since it can be reused - this way there is no need to
 * construct a new array object for each invocation. (IE6 perf)
 * @type Array
 */
JstProcessor.attributeList_ = [];


/**
 * Prepares the template: preprocesses all jstemplate attributes.
 *
 * @param {Element} template
 */
JstProcessor.prepareTemplate_ = function(template) {
  if (!template[PROP_jstcache]) {
    domTraverseElements(template, function(node) {
      JstProcessor.prepareNode_(node);
    });
  }
};


/**
 * A list of attributes we use to specify jst processing instructions,
 * and the functions used to parse their values.
 *
 * @type Array<Array>
 */
var JST_ATTRIBUTES = [
    [ ATT_select, jsEvalToFunction ],
    [ ATT_display, jsEvalToFunction ],
    [ ATT_values, jsEvalToValues ],
    [ ATT_vars, jsEvalToValues ],
    [ ATT_eval, jsEvalToExpressions ],
    [ ATT_transclude, jsEvalToSelf ],
    [ ATT_content, jsEvalToFunction ],
    [ ATT_skip, jsEvalToFunction ]
];


/**
 * Prepares a single node: preprocesses all template attributes of the
 * node, and if there are any, assigns a jsid attribute and stores the
 * preprocessed attributes under the jsid in the jstcache.
 *
 * @param {Element} node
 *
 * @return {Object} The jstcache entry. The processed jst attributes
 * are properties of this object. If the node has no jst attributes,
 * returns an object with no properties (the jscache_[0] entry).
 */
JstProcessor.prepareNode_ = function(node) {
  // If the node already has a cache property, return it.
  if (node[PROP_jstcache]) {
    return node[PROP_jstcache];
  }

  // If it is not found, we always set the PROP_jstcache property on the node.
  // Accessing the property is faster than executing getAttribute(). If we
  // don't find the property on a node that was cloned in jstSelect_(), we
  // will fall back to check for the attribute and set the property
  // from cache.

  // If the node has an attribute indexing a cache object, set it as a property
  // and return it.
  var jstid = domGetAttribute(node, ATT_jstcache);
  if (jstid != null) {
    return node[PROP_jstcache] = JstProcessor.jstcache_[jstid];
  }

  var attributeValues = JstProcessor.attributeValues_;
  var attributeList = JstProcessor.attributeList_;
  attributeList.length = 0;

  // Look for interesting attributes.
  for (var i = 0, I = jsLength(JST_ATTRIBUTES); i < I; ++i) {
    var name = JST_ATTRIBUTES[i][0];
    var value = domGetAttribute(node, name);
    attributeValues[name] = value;
    if (value != null) {
      attributeList.push(name + "=" + value);
    }
  }

  // If none found, mark this node to prevent further inspection, and return
  // an empty cache object.
  if (attributeList.length == 0) {
    domSetAttribute(node, ATT_jstcache, STRING_zero);
    return node[PROP_jstcache] = JstProcessor.jstcache_[0];
  }

  // If we already have a cache object corresponding to these attributes,
  // annotate the node with it, and return it.
  var attstring = attributeList.join(CHAR_ampersand);
  if (jstid = JstProcessor.jstcacheattributes_[attstring]) {
    domSetAttribute(node, ATT_jstcache, jstid);
    return node[PROP_jstcache] = JstProcessor.jstcache_[jstid];
  }

  // Otherwise, build a new cache object.
  var jstcache = {};
  for (var i = 0, I = jsLength(JST_ATTRIBUTES); i < I; ++i) {
    var att = JST_ATTRIBUTES[i];
    var name = att[0];
    var parse = att[1];
    var value = attributeValues[name];
    if (value != null) {
      jstcache[name] = parse(value);
      if (MAPS_DEBUG) {
        jstcache.jstAttributeValues = jstcache.jstAttributeValues || {};
        jstcache.jstAttributeValues[name] = value;
      }
    }
  }

  jstid = STRING_empty + ++JstProcessor.jstid_;
  domSetAttribute(node, ATT_jstcache, jstid);
  JstProcessor.jstcache_[jstid] = jstcache;
  JstProcessor.jstcacheattributes_[attstring] = jstid;

  return node[PROP_jstcache] = jstcache;
};


/**
 * Runs the given function in our state machine.
 *
 * It's informative to view the set of all function calls as a tree:
 * - nodes are states
 * - edges are state transitions, implemented as calls to the pending
 *   functions in the stack.
 *   - pre-order function calls are downward edges (recursion into call).
 *   - post-order function calls are upward edges (return from call).
 * - leaves are nodes which do not recurse.
 * We represent the call tree as an array of array of calls, indexed as
 * stack[depth][index].  Here [depth] indexes into the call stack, and
 * [index] indexes into the call queue at that depth.  We require a call
 * queue so that a node may branch to more than one child
 * (which will be called serially), typically due to a loop structure.
 *
 * @param {Function} f The first function to run.
 */
JstProcessor.prototype.run_ = function(f) {
  var me = this;

  /**
   * A stack of queues of pre-order calls.
   * The inner arrays (constituent queues) are structured as
   * [ arg2, arg1, method, arg2, arg1, method, ...]
   * ie. a flattened array of methods with 2 arguments, in reverse order
   * for efficient push/pop.
   *
   * The outer array is a stack of such queues.
   *
   * @type Array<Array>
   */
  var calls = me.calls_ = [];

  /**
   * The index into the queue for each depth. NOTE: Alternative would
   * be to maintain the queues in reverse order (popping off of the
   * end) but the repeated calls to .pop() consumed 90% of this
   * function's execution time.
   * @type Array<number>
   */
  var queueIndices = me.queueIndices_ = [];

  /**
   * A pool of empty arrays.  Minimizes object allocation for IE6's benefit.
   * @type Array<Array>
   */
  var arrayPool = me.arrayPool_ = [];

  f();
  var queue, queueIndex;
  var method, arg1, arg2;
  var temp;
  while (calls.length) {
    queue = calls[calls.length - 1];
    queueIndex = queueIndices[queueIndices.length - 1];
    if (queueIndex >= queue.length) {
      me.recycleArray_(calls.pop());
      queueIndices.pop();
      continue;
    }

    // Run the first function in the queue.
    method = queue[queueIndex++];
    arg1 = queue[queueIndex++];
    arg2 = queue[queueIndex++];
    queueIndices[queueIndices.length - 1] = queueIndex;
    method.call(me, arg1, arg2);
  }
};


/**
 * Pushes one or more functions onto the stack.  These will be run in sequence,
 * interspersed with any recursive calls that they make.
 *
 * This method takes ownership of the given array!
 *
 * @param {Array} args Array of method calls structured as
 *     [ method, arg1, arg2, method, arg1, arg2, ... ]
 */
JstProcessor.prototype.push_ = function(args) {
  this.calls_.push(args);
  this.queueIndices_.push(0);
};


/**
 * Enable/disable debugging.
 * @param {boolean} debugging New state
 */
JstProcessor.prototype.setDebugging = function(debugging) {
  if (MAPS_DEBUG) {
    this.debugging_ = debugging;
  }
};


JstProcessor.prototype.createArray_ = function() {
  if (this.arrayPool_.length) {
    return this.arrayPool_.pop();
  } else {
    return [];
  }
};


JstProcessor.prototype.recycleArray_ = function(array) {
  arrayClear(array);
  this.arrayPool_.push(array);
};

/**
 * Implements internals of jstProcess. This processes the two
 * attributes transclude and jsselect, which replace or multiply
 * elements, hence the name "outer". The remainder of the attributes
 * is processed in jstProcessInner_(), below. That function
 * jsProcessInner_() only processes attributes that affect an existing
 * node, but doesn't create or destroy nodes, hence the name
 * "inner". jstProcessInner_() is called through jstSelect_() if there
 * is a jsselect attribute (possibly for newly created clones of the
 * current template node), or directly from here if there is none.
 *
 * @param {JsEvalContext} context
 *
 * @param {Element} template
 */
JstProcessor.prototype.jstProcessOuter_ = function(context, template) {
  var me = this;

  var jstAttributes = me.jstAttributes_(template);
  if (MAPS_DEBUG && me.debugging_) {
    me.logState_('Outer', template, jstAttributes.jstAttributeValues);
  }

  var transclude = jstAttributes[ATT_transclude];
  if (transclude) {
    var tr = jstGetTemplate(transclude);
    if (tr) {
      domReplaceChild(tr, template);
      var call = me.createArray_();
      call.push(me.jstProcessOuter_, context, tr);
      me.push_(call);
    } else {
      domRemoveNode(template);
    }
    return;
  }

  var select = jstAttributes[ATT_select];
  if (select) {
    me.jstSelect_(context, template, select);
  } else {
    me.jstProcessInner_(context, template);
  }
};


/**
 * Implements internals of jstProcess. This processes all attributes
 * except transclude and jsselect. It is called either from
 * jstSelect_() for nodes that have a jsselect attribute so that the
 * jsselect attribute will not be processed again, or else directly
 * from jstProcessOuter_(). See the comment on jstProcessOuter_() for
 * an explanation of the name.
 *
 * @param {JsEvalContext} context
 *
 * @param {Element} template
 */
JstProcessor.prototype.jstProcessInner_ = function(context, template) {
  var me = this;

  var jstAttributes = me.jstAttributes_(template);
  if (MAPS_DEBUG && me.debugging_) {
    me.logState_('Inner', template, jstAttributes.jstAttributeValues);
  }

  // NOTE(mesch): See NOTE on ATT_content why this is a separate
  // attribute, and not a special value in ATT_values.
  var display = jstAttributes[ATT_display];
  if (display) {
    var shouldDisplay = context.jsexec(display, template);
    if (MAPS_DEBUG && me.debugging_) {
      me.logs_.push(ATT_display + ': ' + shouldDisplay + '<br/>');
    }
    if (!shouldDisplay) {
      displayNone(template);
      return;
    }
    displayDefault(template);
  }

  // NOTE(mesch): jsvars is evaluated before jsvalues, because it's
  // more useful to be able to use var values in attribute value
  // expressions than vice versa.
  var values = jstAttributes[ATT_vars];
  if (values) {
    me.jstVars_(context, template, values);
  }

  values = jstAttributes[ATT_values];
  if (values) {
    me.jstValues_(context, template, values);
  }

  // Evaluate expressions immediately. Useful for hooking callbacks
  // into jstemplates.
  //
  // NOTE(mesch): Evaluation order is sometimes significant, e.g. when
  // the expression evaluated in jseval relies on the values set in
  // jsvalues, so it needs to be evaluated *after*
  // jsvalues. TODO(mesch): This is quite arbitrary, it would be
  // better if this would have more necessity to it.
  var expressions = jstAttributes[ATT_eval];
  if (expressions) {
    for (var i = 0, I = jsLength(expressions); i < I; ++i) {
      context.jsexec(expressions[i], template);
    }
  }

  var skip = jstAttributes[ATT_skip];
  if (skip) {
    var shouldSkip = context.jsexec(skip, template);
    if (MAPS_DEBUG && me.debugging_) {
      me.logs_.push(ATT_skip + ': ' + shouldSkip + '<br/>');
    }
    if (shouldSkip) return;
  }

  // NOTE(mesch): content is a separate attribute, instead of just a
  // special value mentioned in values, for two reasons: (1) it is
  // fairly common to have only mapped content, and writing
  // content="expr" is shorter than writing values="content:expr", and
  // (2) the presence of content actually terminates traversal, and we
  // need to check for that. Display is a separate attribute for a
  // reason similar to the second, in that its presence *may*
  // terminate traversal.
  var content = jstAttributes[ATT_content];
  if (content) {
    me.jstContent_(context, template, content);

  } else {
    // Newly generated children should be ignored, so we explicitly
    // store the children to be processed.
    var queue = me.createArray_();
    for (var c = template.firstChild; c; c = c.nextSibling) {
      if (c.nodeType == DOM_ELEMENT_NODE) {
        queue.push(me.jstProcessOuter_, context, c);
      }
    }
    if (queue.length) me.push_(queue);
  }
};


/**
 * Implements the jsselect attribute: evalutes the value of the
 * jsselect attribute in the current context, with the current
 * variable bindings (see JsEvalContext.jseval()). If the value is an
 * array, the current template node is multiplied once for every
 * element in the array, with the array element being the context
 * object. If the array is empty, or the value is undefined, then the
 * current template node is dropped. If the value is not an array,
 * then it is just made the context object.
 *
 * @param {JsEvalContext} context The current evaluation context.
 *
 * @param {Element} template The currently processed node of the template.
 *
 * @param {Function} select The javascript expression to evaluate.
 *
 * @notypecheck FIXME(hmitchell): See OCL6434950. instance and value need
 * type checks.
 */
JstProcessor.prototype.jstSelect_ = function(context, template, select) {
  var me = this;

  var value = context.jsexec(select, template);

  // Enable reprocessing: if this template is reprocessed, then only
  // fill the section instance here. Otherwise do the cardinal
  // processing of a new template.
  var instance = domGetAttribute(template, ATT_instance);

  var instanceLast = false;
  if (instance) {
    if (instance.charAt(0) == CHAR_asterisk) {
      instance = parseInt10(instance.substr(1));
      instanceLast = true;
    } else {
      instance = parseInt10(/** @type string */(instance));
    }
  }

  // The expression value instanceof Array is occasionally false for
  // arrays, seen in Firefox. Thus we recognize an array as an object
  // which is not null that has a length property. Notice that this
  // also matches input data with a length property, so this property
  // name should be avoided in input data.
  var multiple = isArray(value);
  var count = multiple ? jsLength(value) : 1;
  var multipleEmpty = (multiple && count == 0);

  if (multiple) {
    if (multipleEmpty) {
      // For an empty array, keep the first template instance and mark
      // it last. Remove all other template instances.
      if (!instance) {
        domSetAttribute(template, ATT_instance, STRING_asteriskzero);
        displayNone(template);
      } else {
        domRemoveNode(template);
      }

    } else {
      displayDefault(template);
      // For a non empty array, create as many template instances as
      // are needed. If the template is first processed, as many
      // template instances are needed as there are values in the
      // array. If the template is reprocessed, new template instances
      // are only needed if there are more array values than template
      // instances. Those additional instances are created by
      // replicating the last template instance.
      //
      // When the template is first processed, there is no jsinstance
      // attribute. This is indicated by instance === null, except in
      // opera it is instance === "". Notice also that the === is
      // essential, because 0 == "", presumably via type coercion to
      // boolean.
      if (instance === null || instance === STRING_empty ||
          (instanceLast && instance < count - 1)) {
        // A queue of calls to push.
        var queue = me.createArray_();

        var instancesStart = instance || 0;
        var i, I, clone;
        for (i = instancesStart, I = count - 1; i < I; ++i) {
          var node = domCloneNode(template);
          domInsertBefore(node, template);

          jstSetInstance(/** @type Element */(node), value, i);
          clone = context.clone(value[i], i, count);

          queue.push(me.jstProcessInner_, clone, node,
                     JsEvalContext.recycle, clone, null);
                     
        }
        // Push the originally present template instance last to keep
        // the order aligned with the DOM order, because the newly
        // created template instances are inserted *before* the
        // original instance.
        jstSetInstance(template, value, i);
        clone = context.clone(value[i], i, count);
        queue.push(me.jstProcessInner_, clone, template,
                   JsEvalContext.recycle, clone, null);
        me.push_(queue);
      } else if (instance < count) {
        var v = value[instance];

        jstSetInstance(template, value, instance);
        var clone = context.clone(v, instance, count);
        var queue = me.createArray_();
        queue.push(me.jstProcessInner_, clone, template,
                   JsEvalContext.recycle, clone, null);
        me.push_(queue);
      } else {
        domRemoveNode(template);
      }
    }
  } else {
    if (value == null) {
      displayNone(template);
    } else {
      displayDefault(template);
      var clone = context.clone(value, 0, 1);
      var queue = me.createArray_();
      queue.push(me.jstProcessInner_, clone, template,
                 JsEvalContext.recycle, clone, null);
      me.push_(queue);
    }
  }
};


/**
 * Implements the jsvars attribute: evaluates each of the values and
 * assigns them to variables in the current context. Similar to
 * jsvalues, except that all values are treated as vars, independent
 * of their names.
 *
 * @param {JsEvalContext} context Current evaluation context.
 *
 * @param {Element} template Currently processed template node.
 *
 * @param {Array} values Processed value of the jsvalues attribute: a
 * flattened array of pairs. The second element in the pair is a
 * function that can be passed to jsexec() for evaluation in the
 * current jscontext, and the first element is the variable name that
 * the value returned by jsexec is assigned to.
 */
JstProcessor.prototype.jstVars_ = function(context, template, values) {
  for (var i = 0, I = jsLength(values); i < I; i += 2) {
    var label = values[i];
    var value = context.jsexec(values[i+1], template);
    context.setVariable(label, value);
  }
};


/**
 * Implements the jsvalues attribute: evaluates each of the values and
 * assigns them to variables in the current context (if the name
 * starts with '$', javascript properties of the current template node
 * (if the name starts with '.'), or DOM attributes of the current
 * template node (otherwise). Since DOM attribute values are always
 * strings, the value is coerced to string in the latter case,
 * otherwise it's the uncoerced javascript value.
 *
 * @param {JsEvalContext} context Current evaluation context.
 *
 * @param {Element} template Currently processed template node.
 *
 * @param {Array} values Processed value of the jsvalues attribute: a
 * flattened array of pairs. The second element in the pair is a
 * function that can be passed to jsexec() for evaluation in the
 * current jscontext, and the first element is the label that
 * determines where the value returned by jsexec is assigned to.
 */
JstProcessor.prototype.jstValues_ = function(context, template, values) {
  for (var i = 0, I = jsLength(values); i < I; i += 2) {
    var label = values[i];
    var value = context.jsexec(values[i+1], template);

    if (label.charAt(0) == CHAR_dollar) {
      // A jsvalues entry whose name starts with $ sets a local
      // variable.
      context.setVariable(label, value);

    } else if (label.charAt(0) == CHAR_period) {
      // A jsvalues entry whose name starts with . sets a property of
      // the current template node. The name may have further dot
      // separated components, which are translated into namespace
      // objects. This specifically allows to set properties on .style
      // using jsvalues. NOTE(mesch): Setting the style attribute has
      // no effect in IE and hence should not be done anyway.
      var nameSpaceLabel = label.substr(1).split(CHAR_period);
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
      // Any other jsvalues entry sets an attribute of the current
      // template node.
      if (typeof value == TYPE_boolean) {
        // Handle boolean values that are set as attributes specially,
        // according to the XML/HTML convention.
        if (value) {
          domSetAttribute(template, label, label);
        } else {
          domRemoveAttribute(template, label);
        }
      } else {
        domSetAttribute(template, label, STRING_empty + value);
      }
    }
  }
};


/**
 * Implements the jscontent attribute. Evalutes the expression in
 * jscontent in the current context and with the current variables,
 * and assigns its string value to the content of the current template
 * node.
 *
 * @param {JsEvalContext} context Current evaluation context.
 *
 * @param {Element} template Currently processed template node.
 *
 * @param {Function} content Processed value of the jscontent
 * attribute.
 */
JstProcessor.prototype.jstContent_ = function(context, template, content) {
  // NOTE(mesch): Profiling shows that this method costs significant
  // time. In jstemplate_perf.html, it's about 50%. I tried to replace
  // by HTML escaping and assignment to innerHTML, but that was even
  // slower.
  var value = STRING_empty + context.jsexec(content, template);
  // Prevent flicker when refreshing a template and the value doesn't
  // change.
  if (template.innerHTML == value) {
    return;
  }
  while (template.firstChild) {
    domRemoveNode(template.firstChild);
  }
  var t = domCreateTextNode(this.document_, value);
  domAppendChild(template, t);
};


/**
 * Caches access to and parsing of template processing attributes. If
 * domGetAttribute() is called every time a template attribute value
 * is used, it takes more than 10% of the time.
 *
 * @param {Element} template A DOM element node of the template.
 *
 * @return {Object} A javascript object that has all js template
 * processing attribute values of the node as properties.
 */
JstProcessor.prototype.jstAttributes_ = function(template) {
  if (template[PROP_jstcache]) {
    return template[PROP_jstcache];
  }

  var jstid = domGetAttribute(template, ATT_jstcache);
  if (jstid) {
    return template[PROP_jstcache] = JstProcessor.jstcache_[jstid];
  }

  return JstProcessor.prepareNode_(template);
};


/**
 * Helps to implement the transclude attribute, and is the initial
 * call to get hold of a template from its ID.
 *
 * If the ID is not present in the DOM, and opt_loadHtmlFn is specified, this
 * function will call that function and add the result to the DOM, before
 * returning the template.
 *
 * @param {string} name The ID of the HTML element used as template.
 * @param {Function} opt_loadHtmlFn A function which, when called, will return
 *   HTML that contains an element whose ID is 'name'.
 *
 * @return {Element|null} The DOM node of the template. (Only element nodes
 * can be found by ID, hence it's a Element.)
 */
function jstGetTemplate(name, opt_loadHtmlFn) {
  var doc = document;
  var section;
  if (opt_loadHtmlFn) {
    section = jstLoadTemplateIfNotPresent(doc, name, opt_loadHtmlFn);
  } else {
    section = domGetElementById(doc, name);
  }
  if (section) {
    JstProcessor.prepareTemplate_(section);
    var ret = domCloneElement(section);
    domRemoveAttribute(ret, STRING_id);
    return ret;
  } else {
    return null;
  }
}

/**
 * This function is the same as 'jstGetTemplate' but, if the template
 * does not exist, throw an exception.
 *
 * @param {string} name The ID of the HTML element used as template.
 * @param {Function} opt_loadHtmlFn A function which, when called, will return
 *   HTML that contains an element whose ID is 'name'.
 *
 * @return {Element} The DOM node of the template. (Only element nodes
 * can be found by ID, hence it's a Element.)
 */
function jstGetTemplateOrDie(name, opt_loadHtmlFn) {
  var x = jstGetTemplate(name, opt_loadHtmlFn);
  check(x !== null);
  return /** @type Element */(x);
}


/**
 * If an element with id 'name' is not present in the document, call loadHtmlFn
 * and insert the result into the DOM.
 *
 * @param {Document} doc
 * @param {string} name
 * @param {Function} loadHtmlFn A function that returns HTML to be inserted
 * into the DOM.
 * @param {string} opt_target The id of a DOM object under which to attach the
 *   HTML once it's inserted.  An object with this id is created if it does not
 *   exist.
 * @return {Element} The node whose id is 'name'
 */
function jstLoadTemplateIfNotPresent(doc, name, loadHtmlFn, opt_target) {
  var section = domGetElementById(doc, name);
  if (section) {
    return section;
  }
  // Load any necessary HTML and try again.
  jstLoadTemplate_(doc, loadHtmlFn(), opt_target || STRING_jsts);
  var section = domGetElementById(doc, name);
  if (!section) {
    log("Error: jstGetTemplate was provided with opt_loadHtmlFn, " +
	"but that function did not provide the id '" + name + "'.");
  }
  return /** @type Element */(section);
}


/**
 * Loads the given HTML text into the given document, so that
 * jstGetTemplate can find it.
 *
 * We append it to the element identified by targetId, which is hidden.
 * If it doesn't exist, it is created.
 *
 * @param {Document} doc The document to create the template in.
 *
 * @param {string} html HTML text to be inserted into the document.
 *
 * @param {string} targetId The id of a DOM object under which to attach the
 *   HTML once it's inserted.  An object with this id is created if it does not
 *   exist.
 */
function jstLoadTemplate_(doc, html, targetId) {
  var existing_target = domGetElementById(doc, targetId);
  var target;
  if (!existing_target) {
    target = domCreateElement(doc, STRING_div);
    target.id = targetId;
    displayNone(target);
    positionAbsolute(target);
    domAppendChild(doc.body, target);
  } else {
    target = existing_target;
  }
  var div = domCreateElement(doc, STRING_div);
  target.appendChild(div);
  div.innerHTML = html;
}


/**
 * Sets the jsinstance attribute on a node according to its context.
 *
 * @param {Element} template The template DOM node to set the instance
 * attribute on.
 *
 * @param {Array} values The current input context, the array of
 * values of which the template node will render one instance.
 *
 * @param {number} index The index of this template node in values.
 */
function jstSetInstance(template, values, index) {
  if (index == jsLength(values) - 1) {
    domSetAttribute(template, ATT_instance, CHAR_asterisk + index);
  } else {
    domSetAttribute(template, ATT_instance, STRING_empty + index);
  }
}


/**
 * Log the current state.
 * @param {string} caller An identifier for the caller of .log_.
 * @param {Element} template The template node being processed.
 * @param {Object} jstAttributeValues The jst attributes of the template node.
 */
JstProcessor.prototype.logState_ = function(
    caller, template, jstAttributeValues) {
  if (MAPS_DEBUG) {
    var msg = '<table>';
    msg += '<caption>' + caller + '</caption>';
    msg += '<tbody>';
    if (template.id) {
      msg += '<tr><td>' + 'id:' + '</td><td>' + template.id + '</td></tr>';
    }
    if (template.name) {
      msg += '<tr><td>' + 'name:' + '</td><td>' + template.name + '</td></tr>';
    }
    if (jstAttributeValues) {
      msg += '<tr><td>' + 'attr:' +
      '</td><td>' + jsToSource(jstAttributeValues) + '</td></tr>';
    }
    msg += '</tbody></table><br/>';
    this.logs_.push(msg);
  }
};


/**
 * Retrieve the processing logs.
 * @return {Array<string>} The processing logs.
 */
JstProcessor.prototype.getLogs = function() {
  return this.logs_;
};
