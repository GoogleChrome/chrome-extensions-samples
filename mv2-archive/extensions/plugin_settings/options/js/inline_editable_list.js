// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('options', function() {
  const DeletableItem = options.DeletableItem;
  const DeletableItemList = options.DeletableItemList;

  /**
   * Creates a new list item with support for inline editing.
   * @constructor
   * @extends {options.DeletableListItem}
   */
  function InlineEditableItem() {
    var el = cr.doc.createElement('div');
    InlineEditableItem.decorate(el);
    return el;
  }

  /**
   * Decorates an element as a inline-editable list item. Note that this is
   * a subclass of DeletableItem.
   * @param {!HTMLElement} el The element to decorate.
   */
  InlineEditableItem.decorate = function(el) {
    el.__proto__ = InlineEditableItem.prototype;
    el.decorate();
  };

  InlineEditableItem.prototype = {
    __proto__: DeletableItem.prototype,

    /**
     * Whether or not this item can be edited.
     * @type {boolean}
     * @private
     */
    editable_: true,

    /**
     * Whether or not this is a placeholder for adding a new item.
     * @type {boolean}
     * @private
     */
    isPlaceholder_: false,

    /**
     * Fields associated with edit mode.
     * @type {array}
     * @private
     */
    editFields_: null,

    /**
     * Whether or not the current edit should be considered cancelled, rather
     * than committed, when editing ends.
     * @type {boolean}
     * @private
     */
    editCancelled_: true,

    /**
     * The editable item corresponding to the last click, if any. Used to decide
     * initial focus when entering edit mode.
     * @type {HTMLElement}
     * @private
     */
    editClickTarget_: null,

    /** @inheritDoc */
    decorate: function() {
      DeletableItem.prototype.decorate.call(this);

      this.editFields_ = [];
      this.addEventListener('mousedown', this.handleMouseDown_);
      this.addEventListener('keydown', this.handleKeyDown_);
      this.addEventListener('leadChange', this.handleLeadChange_);
    },

    /** @inheritDoc */
    selectionChanged: function() {
      this.updateEditState();
    },

    /**
     * Called when this element gains or loses 'lead' status. Updates editing
     * mode accordingly.
     * @private
     */
    handleLeadChange_: function() {
      this.updateEditState();
    },

    /**
     * Updates the edit state based on the current selected and lead states.
     */
    updateEditState: function() {
      if (this.editable)
        this.editing = this.selected && this.lead;
    },

    /**
     * Whether the user is currently editing the list item.
     * @type {boolean}
     */
    get editing() {
      return this.hasAttribute('editing');
    },
    set editing(editing) {
      if (this.editing == editing)
        return;

      if (editing)
        this.setAttribute('editing', '');
      else
        this.removeAttribute('editing');

      if (editing) {
        this.editCancelled_ = false;

        cr.dispatchSimpleEvent(this, 'edit', true);

        var focusElement = this.editClickTarget_ || this.initialFocusElement;
        this.editClickTarget_ = null;

        // When this is called in response to the selectedChange event,
        // the list grabs focus immediately afterwards. Thus we must delay
        // our focus grab.
        var self = this;
        if (focusElement) {
          window.setTimeout(function() {
            // Make sure we are still in edit mode by the time we execute.
            if (self.editing) {
              focusElement.focus();
              focusElement.select();
            }
          }, 50);
        }
      } else {
        if (!this.editCancelled_ && this.hasBeenEdited &&
            this.currentInputIsValid) {
          if (this.isPlaceholder)
            this.parentNode.focusPlaceholder = true;

          this.updateStaticValues_();
          cr.dispatchSimpleEvent(this, 'commitedit', true);
        } else {
          this.resetEditableValues_();
          cr.dispatchSimpleEvent(this, 'canceledit', true);
        }
      }
    },

    /**
     * Whether the item is editable.
     * @type {boolean}
     */
    get editable() {
      return this.editable_;
    },
    set editable(editable) {
      this.editable_ = editable;
      if (!editable)
        this.editing = false;
    },

    /**
     * Whether the item is a new item placeholder.
     * @type {boolean}
     */
    get isPlaceholder() {
      return this.isPlaceholder_;
    },
    set isPlaceholder(isPlaceholder) {
      this.isPlaceholder_ = isPlaceholder;
      if (isPlaceholder)
        this.deletable = false;
    },

    /**
     * The HTML element that should have focus initially when editing starts,
     * if a specific element wasn't clicked.
     * Defaults to the first <input> element; can be overriden by subclasses if
     * a different element should be focused.
     * @type {HTMLElement}
     */
    get initialFocusElement() {
      return this.contentElement.querySelector('input');
    },

    /**
     * Whether the input in currently valid to submit. If this returns false
     * when editing would be submitted, either editing will not be ended,
     * or it will be cancelled, depending on the context.
     * Can be overrided by subclasses to perform input validation.
     * @type {boolean}
     */
    get currentInputIsValid() {
      return true;
    },

    /**
     * Returns true if the item has been changed by an edit.
     * Can be overrided by subclasses to return false when nothing has changed
     * to avoid unnecessary commits.
     * @type {boolean}
     */
    get hasBeenEdited() {
      return true;
    },

    /**
     * Returns a div containing an <input>, as well as static text if
     * isPlaceholder is not true.
     * @param {string} text The text of the cell.
     * @return {HTMLElement} The HTML element for the cell.
     * @private
     */
    createEditableTextCell: function(text) {
      var container = this.ownerDocument.createElement('div');

      if (!this.isPlaceholder) {
        var textEl = this.ownerDocument.createElement('div');
        textEl.className = 'static-text';
        textEl.textContent = text;
        textEl.setAttribute('displaymode', 'static');
        container.appendChild(textEl);
      }

      var inputEl = this.ownerDocument.createElement('input');
      inputEl.type = 'text';
      inputEl.value = text;
      if (!this.isPlaceholder) {
        inputEl.setAttribute('displaymode', 'edit');
        inputEl.staticVersion = textEl;
      } else {
        // At this point |this| is not attached to the parent list yet, so give
        // a short timeout in order for the attachment to occur.
        var self = this;
        window.setTimeout(function() {
          var list = self.parentNode;
          if (list && list.focusPlaceholder) {
            list.focusPlaceholder = false;
            if (list.shouldFocusPlaceholder())
              inputEl.focus();
          }
        }, 50);
      }

      inputEl.addEventListener('focus', this.handleFocus_.bind(this));
      container.appendChild(inputEl);
      this.editFields_.push(inputEl);

      return container;
    },

    /**
     * Resets the editable version of any controls created by createEditable*
     * to match the static text.
     * @private
     */
    resetEditableValues_: function() {
      var editFields = this.editFields_;
      for (var i = 0; i < editFields.length; i++) {
        var staticLabel = editFields[i].staticVersion;
        if (!staticLabel && !this.isPlaceholder)
          continue;

        if (editFields[i].tagName == 'INPUT') {
          editFields[i].value =
            this.isPlaceholder ? '' : staticLabel.textContent;
        }
        // Add more tag types here as new createEditable* methods are added.

        editFields[i].setCustomValidity('');
      }
    },

    /**
     * Sets the static version of any controls created by createEditable*
     * to match the current value of the editable version. Called on commit so
     * that there's no flicker of the old value before the model updates.
     * @private
     */
    updateStaticValues_: function() {
      var editFields = this.editFields_;
      for (var i = 0; i < editFields.length; i++) {
        var staticLabel = editFields[i].staticVersion;
        if (!staticLabel)
          continue;

        if (editFields[i].tagName == 'INPUT')
          staticLabel.textContent = editFields[i].value;
        // Add more tag types here as new createEditable* methods are added.
      }
    },

    /**
     * Called a key is pressed. Handles committing and cancelling edits.
     * @param {Event} e The key down event.
     * @private
     */
    handleKeyDown_: function(e) {
      if (!this.editing)
        return;

      var endEdit = false;
      switch (e.key) {
        case 'Escape':
          this.editCancelled_ = true;
          endEdit = true;
          break;
        case 'Enter':
          if (this.currentInputIsValid)
            endEdit = true;
          break;
      }

      if (endEdit) {
        // Blurring will trigger the edit to end; see InlineEditableItemList.
        this.ownerDocument.activeElement.blur();
        // Make sure that handled keys aren't passed on and double-handled.
        // (e.g., esc shouldn't both cancel an edit and close a subpage)
        e.stopPropagation();
      }
    },

    /**
     * Called when the list item is clicked. If the click target corresponds to
     * an editable item, stores that item to focus when edit mode is started.
     * @param {Event} e The mouse down event.
     * @private
     */
    handleMouseDown_: function(e) {
      if (!this.editable || this.editing)
        return;

      var clickTarget = e.target;
      var editFields = this.editFields_;
      for (var i = 0; i < editFields.length; i++) {
        if (editFields[i] == clickTarget ||
            editFields[i].staticVersion == clickTarget) {
          this.editClickTarget_ = editFields[i];
          return;
        }
      }
    },
  };

  /**
   * Takes care of committing changes to inline editable list items when the
   * window loses focus.
   */
  function handleWindowBlurs() {
    window.addEventListener('blur', function(e) {
      var itemAncestor = findAncestor(document.activeElement, function(node) {
        return node instanceof InlineEditableItem;
      });
      if (itemAncestor);
        document.activeElement.blur();
    });
  }
  handleWindowBlurs();

  var InlineEditableItemList = cr.ui.define('list');

  InlineEditableItemList.prototype = {
    __proto__: DeletableItemList.prototype,

    /**
     * Focuses the input element of the placeholder if true.
     * @type {boolean}
     */
    focusPlaceholder: false,

    /** @inheritDoc */
    decorate: function() {
      DeletableItemList.prototype.decorate.call(this);
      this.setAttribute('inlineeditable', '');
      this.addEventListener('hasElementFocusChange',
                            this.handleListFocusChange_);
    },

    /**
     * Called when the list hierarchy as a whole loses or gains focus; starts
     * or ends editing for the lead item if necessary.
     * @param {Event} e The change event.
     * @private
     */
    handleListFocusChange_: function(e) {
      var leadItem = this.getListItemByIndex(this.selectionModel.leadIndex);
      if (leadItem) {
        if (e.newValue)
          leadItem.updateEditState();
        else
          leadItem.editing = false;
      }
    },

    /**
     * May be overridden by subclasses to disable focusing the placeholder.
     * @return true if the placeholder element should be focused on edit commit.
     */
    shouldFocusPlaceholder: function() {
      return true;
    },
  };

  // Export
  return {
    InlineEditableItem: InlineEditableItem,
    InlineEditableItemList: InlineEditableItemList,
  };
});
