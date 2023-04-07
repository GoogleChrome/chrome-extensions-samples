// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

cr.define('cr.ui', function() {
  /** @const */ var EventTarget = cr.EventTarget;

  /**
   * Creates a new selection model that is to be used with lists. This only
   * allows a single index to be selected.
   *
   * @param {number=} opt_length The number items in the selection.
   *
   * @constructor
   * @extends {!cr.EventTarget}
   */
  function ListSingleSelectionModel(opt_length) {
    this.length_ = opt_length || 0;
    this.selectedIndex = -1;
  }

  ListSingleSelectionModel.prototype = {
    __proto__: EventTarget.prototype,

    /**
     * The number of items in the model.
     * @type {number}
     */
    get length() {
      return this.length_;
    },

    /**
     * @type {!Array} The selected indexes.
     */
    get selectedIndexes() {
      var i = this.selectedIndex;
      return i != -1 ? [this.selectedIndex] : [];
    },

    /**
     * Convenience getter which returns the first selected index.
     * @type {number}
     */
    get selectedIndex() {
      return this.selectedIndex_;
    },
    set selectedIndex(selectedIndex) {
      var oldSelectedIndex = this.selectedIndex;
      var i = Math.max(-1, Math.min(this.length_ - 1, selectedIndex));

      if (i != oldSelectedIndex) {
        this.beginChange();
        this.selectedIndex_ = i
        this.endChange();
      }
    },

    /**
     * Selects a range of indexes, starting with {@code start} and ends with
     * {@code end}.
     * @param {number} start The first index to select.
     * @param {number} end The last index to select.
     */
    selectRange: function(start, end) {
      // Only select first index.
      this.selectedIndex = Math.min(start, end);
    },

    /**
     * Selects all indexes.
     */
    selectAll: function() {
      // Select all is not allowed on a single selection model
    },

    /**
     * Clears the selection
     */
    clear: function() {
      this.beginChange();
      this.length_ = 0;
      this.selectedIndex = this.anchorIndex = this.leadIndex = -1;
      this.endChange();
    },

    /**
     * Unselects all selected items.
     */
    unselectAll: function() {
      this.selectedIndex = -1;
    },

    /**
     * Sets the selected state for an index.
     * @param {number} index The index to set the selected state for.
     * @param {boolean} b Whether to select the index or not.
     */
    setIndexSelected: function(index, b) {
      // Only allow selection
      var oldSelected = index == this.selectedIndex_;
      if (oldSelected == b)
        return;

      if (b)
        this.selectedIndex = index;
      else if (index == this.selectedIndex_)
        this.selectedIndex = -1;
    },

    /**
     * Whether a given index is selected or not.
     * @param {number} index The index to check.
     * @return {boolean} Whether an index is selected.
     */
    getIndexSelected: function(index) {
      return index == this.selectedIndex_;
    },

    /**
     * This is used to begin batching changes. Call {@code endChange} when you
     * are done making changes.
     */
    beginChange: function() {
      if (!this.changeCount_) {
        this.changeCount_ = 0;
        this.selectedIndexBefore_ = this.selectedIndex_;
      }
      this.changeCount_++;
    },

    /**
     * Call this after changes are done and it will dispatch a change event if
     * any changes were actually done.
     */
    endChange: function() {
      this.changeCount_--;
      if (!this.changeCount_) {
        if (this.selectedIndexBefore_ != this.selectedIndex_) {
          var e = new Event('change');
          var indexes = [this.selectedIndexBefore_, this.selectedIndex_];
          e.changes = indexes.filter(function(index) {
            return index != -1;
          }).map(function(index) {
            return {
              index: index,
              selected: index == this.selectedIndex_
            };
          }, this);
          this.dispatchEvent(e);
        }
      }
    },

    leadIndex_: -1,

    /**
     * The leadIndex is used with multiple selection and it is the index that
     * the user is moving using the arrow keys.
     * @type {number}
     */
    get leadIndex() {
      return this.leadIndex_;
    },
    set leadIndex(leadIndex) {
      var li = Math.max(-1, Math.min(this.length_ - 1, leadIndex));
      if (li != this.leadIndex_) {
        var oldLeadIndex = this.leadIndex_;
        this.leadIndex_ = li;
        cr.dispatchPropertyChange(this, 'leadIndex', li, oldLeadIndex);
        cr.dispatchPropertyChange(this, 'anchorIndex', li, oldLeadIndex);
      }
    },

    /**
     * The anchorIndex is used with multiple selection.
     * @type {number}
     */
    get anchorIndex() {
      return this.leadIndex;
    },
    set anchorIndex(anchorIndex) {
      this.leadIndex = anchorIndex;
    },

    /**
     * Whether the selection model supports multiple selected items.
     * @type {boolean}
     */
    get multiple() {
      return false;
    },

    /**
     * Adjusts the selection after reordering of items in the table.
     * @param {!Array<number>} permutation The reordering permutation.
     */
    adjustToReordering: function(permutation) {
      if (this.leadIndex != -1)
        this.leadIndex = permutation[this.leadIndex];

      var oldSelectedIndex = this.selectedIndex;
      if (oldSelectedIndex != -1) {
        this.selectedIndex = permutation[oldSelectedIndex];
      }
    },

    /**
     * Adjusts selection model length.
     * @param {number} length New selection model length.
     */
    adjustLength: function(length) {
      this.length_ = length;
    }
  };

  return {
    ListSingleSelectionModel: ListSingleSelectionModel
  };
});
