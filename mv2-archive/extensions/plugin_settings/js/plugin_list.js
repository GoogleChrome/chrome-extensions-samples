// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Defines a list of plugins that shows for each plugin a list
 * of content setting rules.
 */

cr.define('pluginSettings.ui', function() {
  const List = cr.ui.List;
  const ListItem = cr.ui.ListItem;
  const ListSingleSelectionModel = cr.ui.ListSingleSelectionModel;

  /**
   * CSS classes used by this class.
   * @enum {string}
   */
  const CSSClass = {

    /**
     * Hides an element.
     */
    HIDDEN: 'hidden',

    /**
     * A plugin list.
     */
    PLUGIN_LIST: 'plugin-list',

    /**
     * Set on a plugin list entry to show details about the plugin.
     */
    PLUGIN_SHOW_DETAILS: 'plugin-show-details',

    /**
     * The plugin name.
     */
    PLUGIN_NAME: 'plugin-name',

    /**
     * The number of rules set for a plugin.
     */
    NUM_RULES: 'num-rules',

    /**
     * The element containing details about a plugin.
     */
    PLUGIN_DETAILS: 'plugin-details',

    /**
     * The element containing the column headers for the list of rules.
     */
    COLUMN_HEADERS: 'column-headers',

    /**
     * The header for the pattern column.
     */
    PATTERN_COLUMN_HEADER: 'pattern-column-header',

    /**
     * The header for the setting column.
     */
    SETTING_COLUMN_HEADER: 'setting-column-header',
  };

  /**
   * Returns the item's height, like offsetHeight but such that it works better
   * when the page is zoomed. See the similar calculation in @{code cr.ui.List}.
   * This version also accounts for the animation done in this file.
   * @param {!Element} item The item to get the height of.
   * @return {number} The height of the item, calculated with zooming in mind.
   */
  function getItemHeight(item) {
    var height = item.style.height;
    // Use the fixed animation target height if set, in case the element is
    // currently being animated and we'd get an intermediate height below.
    if (height && height.substr(-2) == 'px') {
      return parseInt(height.substr(0, height.length - 2));
    }
    return item.getBoundingClientRect().height;
  }

  /**
   * Creates a new plugin list item element.
   * @param {!PluginList} list The plugin list containing this item.
   * @param {!Object} info Information about the plugin.
   * @constructor
   * @extends {cr.ui.ListItem}
   */
  function PluginListItem(list, info) {
    var el = cr.doc.createElement('li');

    /**
     * The plugin list containing this item.
     * @type {!PluginList}
     * @private
     */
    el.list_ = list;

    /**
     * Information about the plugin.
     * @type {!Object}
     * @private
     */
    el.info_ = info;

    el.__proto__ = PluginListItem.prototype;
    el.decorate();
    return el;
  }

  PluginListItem.prototype = {
    __proto__: ListItem.prototype,

    /**
     * The element containing details about the plugin. This is only null in
     * the prototype.
     * @type {?HTMLDivElement}
     * @private
     */
    detailsElement_: null,

    /**
     * Initializes the element.
     */
    decorate: function() {
      ListItem.prototype.decorate.call(this);

      var info = this.info_;

      var contentElement = this.ownerDocument.createElement('div');

      var titleEl = this.ownerDocument.createElement('div');
      var nameEl = this.ownerDocument.createElement('span');
      nameEl.className = CSSClass.PLUGIN_NAME;
      nameEl.textContent = info.description;
      nameEl.title = info.description;
      titleEl.appendChild(nameEl);
      this.numRulesEl_ = this.ownerDocument.createElement('span');
      this.numRulesEl_.className = CSSClass.NUM_RULES;
      titleEl.appendChild(this.numRulesEl_);
      contentElement.appendChild(titleEl);

      this.detailsElement_ = this.ownerDocument.createElement('div');
      this.detailsElement_.classList.add(CSSClass.PLUGIN_DETAILS);
      this.detailsElement_.classList.add(CSSClass.HIDDEN);

      var columnHeadersEl = this.ownerDocument.createElement('div');
      columnHeadersEl.className = CSSClass.COLUMN_HEADERS;
      var patternColumnEl = this.ownerDocument.createElement('div');
      patternColumnEl.textContent =
          chrome.i18n.getMessage('patternColumnHeader');
      patternColumnEl.className = CSSClass.PATTERN_COLUMN_HEADER;
      var settingColumnEl = this.ownerDocument.createElement('div');
      settingColumnEl.textContent =
          chrome.i18n.getMessage('settingColumnHeader');
      settingColumnEl.className = CSSClass.SETTING_COLUMN_HEADER;
      columnHeadersEl.appendChild(patternColumnEl);
      columnHeadersEl.appendChild(settingColumnEl);
      this.detailsElement_.appendChild(columnHeadersEl);
      contentElement.appendChild(this.detailsElement_);

      this.appendChild(contentElement);

      var settings = new pluginSettings.Settings(this.info_.id);
      this.updateRulesCount_(settings);
      settings.addEventListener(
          'change',
          this.updateRulesCount_.bind(this, settings));

      // Create the rule list asynchronously, to make sure that it is already
      // fully integrated in the DOM tree.
      window.setTimeout(this.loadRules_.bind(this, settings), 0);
    },

    /**
     * Create the list of content setting rules applying to this plugin.
     * @param {!pluginSettings.Settings} The settings object storing the content
     *     setting rules.
     * @private
     */
    loadRules_: function(settings) {
      var rulesEl = this.ownerDocument.createElement('list');
      this.detailsElement_.appendChild(rulesEl);

      pluginSettings.ui.RuleList.decorate(rulesEl);
      rulesEl.setPluginSettings(settings);
    },

    /**
     * Called when the list of rules changes to update the rule count shown when
     * the list is not expanded.
     * @param {!pluginSettings.Settings} The settings object storing the content
     *     setting rules.
     * @private
     */
    updateRulesCount_: function(settings) {
      this.numRulesEl_.textContent = '(' + settings.getAll().length + ' rules)';
    },

    /**
     * Whether this item is expanded or not.
     * @type {boolean}
     */
    expanded_: false,
    /**
     * Whether this item is expanded or not.
     * @type {boolean}
     */
    get expanded() {
      return this.expanded_;
    },
    set expanded(expanded) {
      if (this.expanded_ == expanded) {
        return;
      }
      this.expanded_ = expanded;
      if (expanded) {
        var oldExpanded = this.list_.expandItem;
        this.list_.expandItem = this;
        this.detailsElement_.classList.remove(CSSClass.HIDDEN);
        if (oldExpanded) {
          oldExpanded.expanded = false;
        }
        this.classList.add(CSSClass.PLUGIN_SHOW_DETAILS);
      } else {
        if (this.list_.expandItem == this) {
          this.list_.leadItemHeight = 0;
          this.list_.expandItem = null;
        }
        this.style.height = '';
        this.detailsElement_.classList.add(CSSClass.HIDDEN);
        this.classList.remove(CSSClass.PLUGIN_SHOW_DETAILS);
      }
    },
  };

  /**
   * Creates a new plugin list.
   * @constructor
   * @extends {cr.ui.List}
   */
  var PluginList = cr.ui.define('list');

  PluginList.prototype = {
    __proto__: List.prototype,

    /**
     * Initializes the element.
     */
    decorate: function() {
      List.prototype.decorate.call(this);
      this.classList.add(CSSClass.PLUGIN_LIST);
      var sm = new ListSingleSelectionModel();
      sm.addEventListener('change', this.handleSelectionChange_.bind(this));
      this.selectionModel = sm;
      this.autoExpands = true;
    },

    /**
     * Creates a new plugin list item.
     * @param {!Object} info Information about the plugin.
     */
    createItem: function(info) {
      return new PluginListItem(this, info);
    },

    /**
     * Called when the selection changes.
     * @param {!Event} ce The change event.
     * @private
     */
    handleSelectionChange_: function(ce) {
      ce.changes.forEach(function(change) {
        var listItem = this.getListItemByIndex(change.index);
        if (listItem) {
          if (!change.selected) {
            // TODO(bsmith) explain window timeout (from cookies_list.js)
            window.setTimeout(function() {
              if (!listItem.selected || !listItem.lead) {
                listItem.expanded = false;
              }
            }, 0);
          } else if (listItem.lead) {
            listItem.expanded = true;
          }
        }
      }, this);
    },
  };

  return {
    PluginList: PluginList,
    PluginListItem: PluginListItem,
  };
});
