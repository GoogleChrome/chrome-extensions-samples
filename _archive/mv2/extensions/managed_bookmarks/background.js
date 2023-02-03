// Copyright 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * Maps policy names to the root node that they affect.
 */
var policyToNodeId = {
  'Bookmarks Bar': '1',
  'Other Bookmarks': '2'
};

/**
 * A function that fixes a URL. Turns e.g. "google.com" into
 * "http://google.com/". This is used to correctly match against the
 * canonicalized URLs stored in bookmarks created with the bookmarks API.
 */
var fixURL = (function() {
  // An "a" element is used to parse the given URL and build the fixed version.
  var a = document.createElement('a');
  return function(url) {
    // Preserve null, undefined, etc.
    if (!url)
      return url;
    a.href = url;
    // Handle cases like "google.com", which will be relative to the extension.
    if (a.protocol === 'chrome-extension:' &&
        url.substr(0, 17) !== 'chrome-extension:') {
      a.href = 'http://' + url;
    }
    return a.href;
  }
})();

/**
 * A CallbackChain can be used to wrap other callbacks and perform a list of
 * actions at the end, once all the wrapped callbacks have been invoked.
 */
var CallbackChain = function() {
  this._count = 0;
  this._callbacks = [];
}

CallbackChain.prototype.push = function(callback) {
  this._callbacks.push(callback);
}

CallbackChain.prototype.wrap = function(callback) {
  var self = this;
  self._count++;
  return function() {
    if (callback)
      callback.apply(null, arguments);
    self._count--;
    if (self._count == 0) {
      for (var i = 0; i < self._callbacks.length; ++i)
        self._callbacks[i]();
    }
  }
}

/**
 * Represents a managed bookmark.
 */
var Node = function(nodesMap, id, title, url) {
  this._nodesMap = nodesMap;
  this._id = id;
  this._title = title;
  if (url !== undefined)
    this._url = url;
  else
    this._children = [];
  if (id)
    this._nodesMap[id] = this;
}

Node.prototype.isRoot = function() {
  return this._id in [ '0', '1', '2' ];
}

Node.prototype.getIndex = function() {
  return this._nodesMap[this._parentId]._children.indexOf(this);
}

Node.prototype.appendChild = function(node) {
  node._parentId = this._id;
  this._children.push(node);
}

Node.prototype.droppedFromParent = function() {
  // Remove |this| and its children from the |nodesMap|.
  var nodesMap = this._nodesMap;
  var removeFromNodesMap = function(node) {
    delete nodesMap[node._id];
    (node._children || []).forEach(removeFromNodesMap);
  }
  removeFromNodesMap(this);

  if (this._children)
    chrome.bookmarks.removeTree(this._id);
  else
    chrome.bookmarks.remove(this._id);
}

Node.prototype.matches = function(bookmark) {
  return this._title === bookmark.title &&
         this._url === bookmark.url &&
         typeof this._children === typeof bookmark.children;
}

/**
 * Makes this node's children match |wantedChildren|.
 */
Node.prototype.updateChildren = function(wantedChildren, callbackChain) {
  // Rebuild the list of children to match |wantedChildren|.
  var currentChildren = this._children;
  this._children = [];
  for (var i = 0; i < wantedChildren.length; ++i) {
    var currentChild = currentChildren[i];
    var wantedChild = wantedChildren[i];
    wantedChild.url = fixURL(wantedChild.url);

    if (currentChild && currentChild.matches(wantedChild)) {
      this.appendChild(currentChild);
      if (wantedChild.children)
        currentChild.updateChildren(wantedChild.children, callbackChain);
    } else {
      // This child is either missing, invalid or misplaced; drop it and
      // generate it again. Note that the actual dropping is delayed so that
      // bookmarks.onRemoved is triggered after the changes have been persisted.
      if (currentChild)
        callbackChain.push(currentChild.droppedFromParent.bind(currentChild));
      // The "id" comes with the callback from bookmarks.create() but the Node
      // is created now so that the child is placed at the right position.
      var newChild = new Node(
          this._nodesMap, undefined, wantedChild.title, wantedChild.url);
      this.appendChild(newChild);
      chrome.bookmarks.create({
        'parentId': this._id,
        'title': newChild._title,
        'url': newChild._url,
        'index': i
      }, callbackChain.wrap((function(wantedChild, newChild, createdNode) {
        newChild._id = createdNode.id;
        newChild._nodesMap[newChild._id] = newChild;
        if (wantedChild.children)
          newChild.updateChildren(wantedChild.children, callbackChain);
      }).bind(null, wantedChild, newChild)));
    }
  }

  // Drop all additional bookmarks past the end that are not wanted anymore.
  if (currentChildren.length > wantedChildren.length) {
    var chainCounter = callbackChain.wrap();
    currentChildren.slice(wantedChildren.length).forEach(function(child) {
      callbackChain.push(child.droppedFromParent.bind(child));
    });
    // This wrapped nop makes sure that the callbacks appended to the chain
    // execute if nothing else was wrapped.
    chainCounter();
  }
}

/**
 * Creates new nodes in the bookmark model to represent this Node and its
 * children.
 */
Node.prototype.regenerate = function(parentId, index, callbackChain) {
  var self = this;
  chrome.bookmarks.create({
    'parentId': parentId,
    'title': self._title,
    'url': self._url,
    'index': index
  }, callbackChain.wrap(function(newNode) {
    delete self._nodesMap[self._id];
    self._id = newNode.id;
    self._parentId = newNode.parentId;
    self._nodesMap[self._id] = self;
    (self._children || []).forEach(function(child, i) {
      child.regenerate(self._id, i, callbackChain);
    });
  }));
}

/**
 * Moves this node to the correct position in the model.
 * |currentParentId| and |currentIndex| indicate the current position in
 * the model, which may not match the expected position.
 */
Node.prototype.moveInModel = function(currentParentId, currentIndex, callback) {
  var index = this.getIndex();
  if (currentParentId == this._parentId) {
    if (index == currentIndex) {
      // Nothing to do.
      callback();
      return;
    } else if (index > currentIndex) {
      // A bookmark moved is inserted at the new position before it is removed
      // from the previous position. So when moving forward in the same parent,
      // the index must be adjusted by one from the desired index.
      ++index;
    }
  }
  chrome.bookmarks.move(this._id, {
    'parentId': this._parentId,
    'index': index
  }, callback);
}

/**
 * Moves any misplaced child nodes into their expected positions.
 */
Node.prototype.reorderChildren = function() {
  var self = this;
  chrome.bookmarks.getChildren(self._id, function(currentOrder) {
    for (var i = 0; i < currentOrder.length; ++i) {
      var node = currentOrder[i];
      var child = self._nodesMap[node.id];
      if (child && child.getIndex() != i) {
        // Check again after moving this child.
        child.moveInModel(
            node.parentId, node.index, self.reorderChildren.bind(self));
        return;
      }
    }
  });
}

var serializeNode = function(node) {
  var result = {
    'id': node._id,
    'title': node._title
  }
  if (node._url)
    result['url'] = node._url;
  else
    result['children'] = node._children.map(serializeNode);
  return result;
}

var unserializeNode = function(nodesMap, node) {
  var result = new Node(nodesMap, node['id'], node['title'], node['url']);
  if (node.children) {
    node.children.forEach(function(child) {
      result.appendChild(unserializeNode(nodesMap, child));
    });
  }
  return result;
}

/**
 * Tracks all the managed bookmarks, and persists the known state so that
 * managed bookmarks can be updated after restarts.
 */
var ManagedBookmarkTree = function() {
  // Maps a string id to its Node. Used to lookup an entry by ID.
  this._nodesMap = {};
  this._root = new Node(this._nodesMap, '0', '');
  this._root.appendChild(new Node(this._nodesMap, '1', 'Bookmarks Bar'));
  this._root.appendChild(new Node(this._nodesMap, '2', 'Other Bookmarks'));
}

ManagedBookmarkTree.prototype.store = function() {
  chrome.storage.local.set({
    'ManagedBookmarkTree': serializeNode(this._root)
  });
}

ManagedBookmarkTree.prototype.load = function(callback) {
  var self = this;
  chrome.storage.local.get('ManagedBookmarkTree', function(result) {
    if (result.hasOwnProperty('ManagedBookmarkTree')) {
      self._nodesMap = {};
      self._root = unserializeNode(self._nodesMap,
                                   result['ManagedBookmarkTree']);
    }
    callback();
  });
}

ManagedBookmarkTree.prototype.getById = function(id) {
  return this._nodesMap[id];
}

ManagedBookmarkTree.prototype.update = function(rootNodeId, currentPolicy) {
  // Note that the |callbackChain| is only invoked if a callback is wrapped,
  // otherwise its callbacks are never invoked. So store() is called only if
  // bookmarks.create() is actually used.
  var callbackChain = new CallbackChain();
  callbackChain.push(this.store.bind(this));
  this._nodesMap[rootNodeId].updateChildren(currentPolicy || [], callbackChain);
}

var tree = new ManagedBookmarkTree();

chrome.runtime.onInstalled.addListener(function() {
  // Enforce the initial policy.
  // This load() should be empty on the first install, but is useful during
  // development to handle reloads.
  tree.load(function() {
    chrome.storage.managed.get(function(policy) {
      Object.keys(policyToNodeId).forEach(function(policyName) {
        tree.update(policyToNodeId[policyName], policy[policyName]);
      });
    });
  });
});

// Start observing policy changes. The tree is reloaded since this may be
// called back while the page was inactive.
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace !== 'managed')
    return;
  tree.load(function() {
    Object.keys(changes).forEach(function(policyName) {
      tree.update(policyToNodeId[policyName], changes[policyName].newValue);
    });
  });
});

// Observe bookmark modifications and revert any modifications made to managed
// bookmarks. The tree is always reloaded in case the events happened while the
// page was inactive.

chrome.bookmarks.onMoved.addListener(function(id, info) {
  tree.load(function() {
    var managedNode = tree.getById(id);
    if (managedNode && !managedNode.isRoot()) {
      managedNode.moveInModel(info.parentId, info.index, function(){});
    } else {
      // Check if the parent node has managed children that need to move.
      // Example: moving a non-managed bookmark in front of the managed
      // bookmarks.
      var parentNode = tree.getById(info.parentId);
      if (parentNode)
        parentNode.reorderChildren();
    }
  });
});

chrome.bookmarks.onChanged.addListener(function(id, info) {
  tree.load(function() {
    var managedNode = tree.getById(id);
    if (!managedNode || managedNode.isRoot())
      return;
    chrome.bookmarks.update(id, {
      'title': managedNode._title,
      'url': managedNode._url
    });
  });
});

chrome.bookmarks.onRemoved.addListener(function(id, info) {
  tree.load(function() {
    var managedNode = tree.getById(id);
    if (!managedNode || managedNode.isRoot())
      return;
    // A new tree.store() is needed at the end because the regenerated nodes
    // will have new IDs.
    var callbackChain = new CallbackChain();
    callbackChain.push(tree.store.bind(tree));
    managedNode.regenerate(info.parentId, info.index, callbackChain);
  });
});
