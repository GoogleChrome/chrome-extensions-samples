// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Defines a list of content setting rules.
 */

cr.define('pluginSettings.ui', function() {
  const InlineEditableItemList = options.InlineEditableItemList;
  const InlineEditableItem = options.InlineEditableItem;
  const ArrayDataModel = cr.ui.ArrayDataModel;

  /**
   * CSS classes used by this class.
   * @enum {string}
   */
  const CSSClass = {
    /**
     * A list of content setting rules.
     */
    RULE_LIST: 'rule-list',

    /**
     * The element containing the content setting pattern for a rule.
     */
    RULE_PATTERN: 'rule-pattern',

    /**
     * The element containing the behavior (allow or block) for a rule.
     */
    RULE_BEHAVIOR: 'rule-behavior',

    /**
     * Static text (as opposed to an editable text field).
     */
    STATIC_TEXT: 'static-text',
  };
  /**
   * A single item in a list of rules.
   * @param {!RuleList} list The rule list containing this item.
   * @param {!Object} rule The content setting rule.
   * @constructor
   * @extends {options.InlineEditableItem}
   */
  function RuleListItem(list, rule) {
    var el = cr.doc.createElement('li');

    /**
     * The content setting rule.
     * @type {!Object}
     * @private
     */
    el.dataItem_ = rule;

    /**
     * The rule list containing this item.
     * @type {!RuleList}
     * @private
     */
    el.list_ = list;
    el.__proto__ = RuleListItem.prototype;
    el.decorate();

    return el;
  }

  RuleListItem.prototype = {
    __proto__: InlineEditableItem.prototype,

    /**
     * The text input element for the pattern. This is only null in the
     * prototype.
     * @type {?HTMLInputElement}
     * @private
     */
    input_: null,

    /**
     * The popup button for the setting. This is only null in the prototype.
     * @type {?HTMLSelectElement}
     * @private
     */
    select_: null,

    /**
     * The static text field containing the pattern.
     * @type {?HTMLDivElement}
     * @private
     */
    patternLabel_: null,

    /**
     * The static text field containing the setting.
     * @type {?HTMLDivElement}
     * @private
     */
    settingLabel_: null,

    /**
     * Decorates an elements as a list item.
     */
    decorate: function() {
      InlineEditableItem.prototype.decorate.call(this);

      this.isPlaceholder = !this.pattern;
      var patternCell = this.createEditableTextCell(this.pattern);
      patternCell.className = CSSClass.RULE_PATTERN;
      this.contentElement.appendChild(patternCell);
      var input = patternCell.querySelector('input');
      if (this.pattern) {
        this.patternLabel_ =
            patternCell.querySelector('.' + CSSClass.STATIC_TEXT);
      } else {
        input.placeholder = chrome.i18n.getMessage('addNewPattern');
      }

      // Setting label for display mode. |pattern| will be null for the 'add new
      // exception' row.
      if (this.pattern) {
        var settingLabel = cr.doc.createElement('span');
        settingLabel.textContent = this.settingForDisplay();
        settingLabel.className = CSSClass.RULE_BEHAVIOR;
        settingLabel.setAttribute('displaymode', 'static');
        this.contentElement.appendChild(settingLabel);
        this.settingLabel_ = settingLabel;
      }

      // Setting select element for edit mode.
      var select = cr.doc.createElement('select');
      var optionAllow = cr.doc.createElement('option');
      optionAllow.textContent = chrome.i18n.getMessage('allowRule');
      optionAllow.value = 'allow';
      select.appendChild(optionAllow);

      var optionBlock = cr.doc.createElement('option');
      optionBlock.textContent = chrome.i18n.getMessage('blockRule');
      optionBlock.value = 'block';
      select.appendChild(optionBlock);

      this.contentElement.appendChild(select);
      select.className = CSSClass.RULE_BEHAVIOR;
      if (this.pattern) {
        select.setAttribute('displaymode', 'edit');
      }

      this.input_ = input;
      this.select_ = select;

      this.updateEditables();

      // Listen for edit events.
      this.addEventListener('canceledit', this.onEditCancelled_);
      this.addEventListener('commitedit', this.onEditCommitted_);
    },

    /**
     * The pattern (e.g., a URL) for the rule.
     * @type {string}
     */
    get pattern() {
      return this.dataItem_['primaryPattern'];
    },
    set pattern(pattern) {
      this.dataItem_['primaryPattern'] = pattern;
    },

    /**
     * The setting (allow/block) for the rule.
     * @type {string}
     */
    get setting() {
      return this.dataItem_['setting'];
    },
    set setting(setting) {
      this.dataItem_['setting'] = setting;
    },

    /**
     * Gets a human-readable setting string.
     * @type {string}
     */
    settingForDisplay: function() {
      var setting = this.setting;
      if (setting == 'allow') {
        return chrome.i18n.getMessage('allowRule');
      }
      if (setting == 'block') {
        return chrome.i18n.getMessage('blockRule');
      }
    },

    /**
     * Set the <input> to its original contents. Used when the user quits
     * editing.
     */
    resetInput: function() {
      this.input_.value = this.pattern;
    },

    /**
     * Copy the data model values to the editable nodes.
     */
    updateEditables: function() {
      this.resetInput();

      var settingOption =
          this.select_.querySelector('[value=\'' + this.setting + '\']');
      if (settingOption) {
        settingOption.selected = true;
      }
    },

    /** @inheritDoc */
    get hasBeenEdited() {
      var livePattern = this.input_.value;
      var liveSetting = this.select_.value;
      return livePattern != this.pattern || liveSetting != this.setting;
    },

    /**
     * Called when committing an edit.
     * @param {!Event} e The end event.
     * @private
     */
    onEditCommitted_: function(e) {
      var newPattern = this.input_.value;
      var newSetting = this.select_.value;

      this.finishEdit(newPattern, newSetting);
    },

    /**
     * Called when cancelling an edit; resets the control states.
     * @param {!Event} e The cancel event.
     * @private
     */
    onEditCancelled_: function() {
      this.updateEditables();
    },

    /**
     * Editing is complete; update the model.
     * @param {string} newPattern The pattern that the user entered.
     * @param {string} newSetting The setting the user chose.
     */
    finishEdit: function(newPattern, newSetting) {
      this.patternLabel_.textContent = newPattern;
      this.settingLabel_.textContent = this.settingForDisplay();
      var oldPattern = this.pattern;
      this.pattern = newPattern;
      this.setting = newSetting;

      this.list_.settings.update(oldPattern, newPattern, newSetting,
                                 this.list_.settingsChangedCallback());
    }
  };

  /**
   * Create a new list item to add a rule.
   * @param {!RuleList} list The rule list containing this item.
   * @constructor
   * @extends {AddRuleListItem}
   */
  function AddRuleListItem(list) {
    var el = cr.doc.createElement('div');
    el.dataItem_ = {};
    el.list_ = list;
    el.__proto__ = AddRuleListItem.prototype;
    el.decorate();

    return el;
  }

  AddRuleListItem.prototype = {
    __proto__: RuleListItem.prototype,

    /**
     * Initializes the element.
     */
    decorate: function() {
      RuleListItem.prototype.decorate.call(this);

      this.setting = 'allow';
    },

    /**
     * Clear the <input> and let the placeholder text show again.
     */
    resetInput: function() {
      this.input_.value = '';
    },

    /** @inheritDoc */
    get hasBeenEdited() {
      return this.input_.value != '';
    },

    /**
     * Editing is complete; update the model. As long as the pattern isn't
     * empty, we'll just add it.
     * @param {string} newPattern The pattern that the user entered.
     * @param {string} newSetting The setting the user chose.
     */
    finishEdit: function(newPattern, newSetting) {
      this.resetInput();
      this.list_.settings.set(newPattern, newSetting,
                              this.list_.settingsChangedCallback());
    },
  };

  /**
   * A list of content setting rules.
   * @constructor
   * @extends {cr.ui.List}
   */
  var RuleList = cr.ui.define('list');

  RuleList.prototype = {
    __proto__: InlineEditableItemList.prototype,

    /**
     * The content settings model for this list.
     * @type {?Settings}
     */
    settings: null,

    /**
     * Called when an element is decorated as a list.
     */
    decorate: function() {
      InlineEditableItemList.prototype.decorate.call(this);

      this.classList.add(CSSClass.RULE_LIST);

      this.autoExpands = true;
      this.reset();
    },

    /**
     * Creates an item to go in the list.
     * @param {?Object} entry The element from the data model for this row.
     */
    createItem: function(entry) {
      if (entry) {
        return new RuleListItem(this, entry);
      } else {
        var addRuleItem = new AddRuleListItem(this);
        addRuleItem.deletable = false;
        return addRuleItem;
      }
    },

    /**
     * Sets the rules in the js model.
     * @param {!Array} entries A list of dictionaries of values, each dictionary
     *     represents a rule.
     */
    setRules_: function(entries) {
      var deleteCount = this.dataModel.length - 1;

      var args = [0, deleteCount];
      args.push.apply(args, entries);
      this.dataModel.splice.apply(this.dataModel, args);
    },

    /**
     * Called when the list of content setting rules has been changed.
     * @param {?string} error The error message, if an error occurred.
     *     Otherwise, this is null.
     * @private
     */
    settingsChanged_: function(error) {
      if (error) {
        $('error').textContent = 'Error: ' + error;
      } else {
        $('error').textContent = '';
      }
      this.setRules_(this.settings.getAll());
    },

    /**
     * @return {function()} A bound callback to update the UI after the
     *     settings have been changed.
     */
    settingsChangedCallback: function() {
      return this.settingsChanged_.bind(this);
    },

    /**
     * Binds this list to the content settings model.
     * @param {!Settings} settings The content settings model.
     */
    setPluginSettings: function(settings) {
      this.settings = settings;
      this.settingsChanged_();
    },

    /**
     * Removes all rules from the js model.
     */
    reset: function() {
      // The null creates the Add New Rule row.
      this.dataModel = new ArrayDataModel([null]);
    },

    /** @inheritDoc */
    deleteItemAtIndex: function(index) {
      var listItem = this.getListItemByIndex(index);
      if (listItem.undeletable) {
        return;
      }

      this.settings.clear(listItem.pattern, this.settingsChangedCallback());
    },
  };

  return {
    RuleListItem: RuleListItem,
    AddRuleListItem: AddRuleListItem,
    RuleList: RuleList,
  }
});
