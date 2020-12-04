// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('options', function() {
  const List = cr.ui.List;
  const ListItem = cr.ui.ListItem;

  /**
   * Creates a deletable list item, which has a button that will trigger a call
   * to deleteItemAtIndex(index) in the list.
   */
  var DeletableItem = cr.ui.define('li');

  DeletableItem.prototype = {
    __proto__: ListItem.prototype,

    /**
     * The element subclasses should populate with content.
     * @type {HTMLElement}
     * @private
     */
    contentElement_: null,

    /**
     * The close button element.
     * @type {HTMLElement}
     * @private
     */
    closeButtonElement_: null,

    /**
     * Whether or not this item can be deleted.
     * @type {boolean}
     * @private
     */
    deletable_: true,

    /** @inheritDoc */
    decorate: function() {
      ListItem.prototype.decorate.call(this);

      this.classList.add('deletable-item');

      this.contentElement_ = this.ownerDocument.createElement('div');
      this.appendChild(this.contentElement_);

      this.closeButtonElement_ = this.ownerDocument.createElement('button');
      this.closeButtonElement_.classList.add('raw-button');
      this.closeButtonElement_.classList.add('close-button');
      this.closeButtonElement_.addEventListener('mousedown',
                                                this.handleMouseDownUpOnClose_);
      this.closeButtonElement_.addEventListener('mouseup',
                                                this.handleMouseDownUpOnClose_);
      this.closeButtonElement_.addEventListener('focus',
                                                this.handleFocus_.bind(this));
      this.appendChild(this.closeButtonElement_);
    },

    /**
     * Returns the element subclasses should add content to.
     * @return {HTMLElement} The element subclasses should popuplate.
     */
    get contentElement() {
      return this.contentElement_;
    },

    /* Gets/sets the deletable property. An item that is not deletable doesn't
     * show the delete button (although space is still reserved for it).
     */
    get deletable() {
      return this.deletable_;
    },
    set deletable(value) {
      this.deletable_ = value;
      this.closeButtonElement_.disabled = !value;
    },

    /**
     * Called when a focusable child element receives focus. Selects this item
     * in the list selection model.
     * @private
     */
    handleFocus_: function() {
      var list = this.parentNode;
      var index = list.getIndexOfListItem(this);
      list.selectionModel.selectedIndex = index;
      list.selectionModel.anchorIndex = index;
    },

    /**
     * Don't let the list have a crack at the event. We don't want clicking the
     * close button to change the selection of the list.
     * @param {Event} e The mouse down/up event object.
     * @private
     */
    handleMouseDownUpOnClose_: function(e) {
      if (!e.target.disabled)
        e.stopPropagation();
    },
  };

  var DeletableItemList = cr.ui.define('list');

  DeletableItemList.prototype = {
    __proto__: List.prototype,

    /** @inheritDoc */
    decorate: function() {
      List.prototype.decorate.call(this);
      this.addEventListener('click', this.handleClick_);
      this.addEventListener('keydown', this.handleKeyDown_);
    },

    /**
     * Callback for onclick events.
     * @param {Event} e The click event object.
     * @private
     */
    handleClick_: function(e) {
      if (this.disabled)
        return;

      var target = e.target;
      if (target.classList.contains('close-button')) {
        var listItem = this.getListItemAncestor(target);
        var selected = this.selectionModel.selectedIndexes;

        // Check if the list item that contains the close button being clicked
        // is not in the list of selected items. Only delete this item in that
        // case.
        var idx = this.getIndexOfListItem(listItem);
        if (selected.indexOf(idx) == -1) {
          this.deleteItemAtIndex(idx);
        } else {
          this.deleteSelectedItems_();
        }
      }
    },

    /**
     * Callback for keydown events.
     * @param {Event} e The keydown event object.
     * @private
     */
    handleKeyDown_: function(e) {
      // Map delete (and backspace on Mac) to item deletion (unless focus is
      // in an input field, where it's intended for text editing).
      if ((e.keyCode == 46 || (e.keyCode == 8 && cr.isMac)) &&
          e.target.tagName != 'INPUT') {
        this.deleteSelectedItems_();
        // Prevent the browser from going back.
        e.preventDefault();
      }
    },

    /**
     * Deletes all the currently selected items that are deletable.
     * @private
     */
    deleteSelectedItems_: function() {
      var selected = this.selectionModel.selectedIndexes;
      // Reverse through the list of selected indexes to maintain the
      // correct index values after deletion.
      for (var j = selected.length - 1; j >= 0; j--) {
        var index = selected[j];
        if (this.getListItemByIndex(index).deletable)
          this.deleteItemAtIndex(index);
      }
    },

    /**
     * Called when an item should be deleted; subclasses are responsible for
     * implementing.
     * @param {number} index The index of the item that is being deleted.
     */
    deleteItemAtIndex: function(index) {
    },
  };

  return {
    DeletableItemList: DeletableItemList,
    DeletableItem: DeletableItem,
  };
});
