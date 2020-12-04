/**
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

/**
 * @fileoverview Includes the country selection, topics selection and
 * selection of no. of news stories to be shown. Include default settings also.
 * @author navneetg@google.com (Navneet Goel).
 */

/**
 * Stores number of selected topics on the options page.
 */
var checkCount = 0;

/**
 * Stores maximum count of custom topics.
 */
var MAX_CUS_TOPICS = 10;

/**
 * Stores temporary added custom topics which are not yet saved.
 */
var tempCusTopics = [];

/**
 * Checks whether ENTER key is pressed or not.
 */
function addCustomTopic() {
  if (window.event.keyCode == 13) {
    addCusTopic();
  }
}

/**
 * Retrieves and sets last saved country from local storage(if found),
 * else sets country retrieved from feed.
 */
function setCountry() {
  var country = window.localStorage.getItem('country');

  // If country is not found in localstorage or default value is selected in
  // drop down menu.
  if ((!country) || country == 'noCountry') {
    // XMLHttpRequest object that tries to load the feed for the purpose of
    // retrieving the country value out of feed.
    var req = new XMLHttpRequest();
    req.onload = handleResponse;
    req.onerror = handleError;
    req.open('GET', DEFAULT_NEWS_URL, true);
    req.send(null);

    // Sets country to default Country in dropdown menu.
    function handleError() {
      $('countryList').value = 'noCountry';
    };

    // Handles parsing the feed data got back from XMLHttpRequest.
    function handleResponse() {
      // Feed document retrieved from URL.
      var doc = req.responseXML;
      if (!doc) {
        handleError();
        return;
      }
      var imageLink = doc.querySelector('image link');
      if (imageLink) {
          // Stores link to set value of country.
          var newsUrl = imageLink.textContent;
      }

      // Stores country value
      $('countryList').value = newsUrl.substring(newsUrl.indexOf('&ned=') + 5,
          newsUrl.indexOf('&hl='));
    };
  } else {
    $('countryList').value = country;
  }
}

/**
 * Displays various messages to user based on user input.
 * @param {String} id Id of status element.
 * @param {Number} timeOut Timeout value of message shown.
 * @param {String} message Message to be shown.
 */
function showUserMessages(id, timeOut, message) {
  $(id).style.setProperty('transition',
      'opacity 0s ease-in');
  $(id).style.opacity = 1;
  $(id).innerText = chrome.i18n.getMessage(message);
  window.setTimeout(function() {
    $(id).style.setProperty(
        'transition', 'opacity' + timeOut + 's ease-in');
    $(id).style.opacity = 0;
    }, 1E3
  );
}

/**
 * Sets options page CSS according to the browser language(if found), else sets
 * to default locale.
 */
function setOptionPageCSS() {
  if (chrome.i18n.getMessage('direction') == 'rtl') {
    document.querySelector('body').className = 'rtl';
  }
}

/**
 * Initializes the options page by retrieving country, topics and count of
 * stories from local storage if present, else sets to default settings.
 */
function initialize() {
  setOptionPageCSS();
  setCountry();
  setCountAndTopicList();
  setLocalizedTopicList();

  // Adds a custom topic on press of Enter key.
  $('newKeyword').onkeypress = addCustomTopic;
}

/**
 * Retrieves locale values from locale file.
 */
function setLocalizedTopicList() {
  var getI18nMsg = chrome.i18n.getMessage;

  $('top').innerText = getI18nMsg('1');
  $('nation').innerText = getI18nMsg('n');
  $('world').innerText = getI18nMsg('w');
  $('business').innerText = getI18nMsg('b');
  $('science').innerText = getI18nMsg('t');
  $('entertainment').innerText = getI18nMsg('e');
  $('sports').innerText = getI18nMsg('s');
  $('health').innerText = getI18nMsg('m');
  $('most').innerText = getI18nMsg('po');
  $('select_country').innerText = getI18nMsg('country');
  $('topic').innerText = getI18nMsg('topic');
  $('save_button').innerText = getI18nMsg('save');
  $('story_count').innerText = getI18nMsg('storyCount');
  $('logo').innerHTML = $('logo').innerHTML + getI18nMsg('newsOption');
  $('custom_text').innerHTML = getI18nMsg('customText') + '<br/>' +
    getI18nMsg('maximumTopics',[MAX_CUS_TOPICS]);
  $('submit_button').value = getI18nMsg('submitButton');
}

/**
 * Sets topic list and number of stories retrieved from localstorage(if any)
 * otherwise sets to default.
 */
function setCountAndTopicList() {
  var topicLists = document.getElementsByClassName('checkBox');

  // Retrieves topics list from localStorage.
  var topics = JSON.parse(window.localStorage.getItem('topics'));

  // Runs if retrieved topic list from local storage contains topics.
  if (topics) {
    for (var x = 0, topicList; topicList = topicLists[x]; x++) {

      // Saves whether checkbox is checked or not.
      var isPresent = false;
      for (var y = 0; y < topics.length; y++) {
        if (topics[y] == topicList.value) {
          topicList.checked = true;
          isPresent = true;
          checkCount++;
          break;
        }
      }
      if (!isPresent) {
        topicList.checked = false;
      }
    }
  }

  // Retrieves list of custom topics from localstorage(if any) and shows it
  // in option page.
  var keywords = JSON.parse(window.localStorage.getItem('keywords'));
  if (keywords) {

    // Template to store custom topics in a table.
    var template = [];
    var title = chrome.i18n.getMessage('deleteTitle');
    for (var i = 0; i < keywords.length; i++) {
      checkCount++;

      template.push('<tr style = "height: 22px;">');
      template.push('<td id = "keyword_value" class = "cusTopicsClass">');
      template.push('<textarea class="noborder" readonly>');
      template.push(keywords[i]);
      template.push('</textarea>');
      template.push('<td class = "suppr" onclick = "delCusTopic(this)" ');
        template.push('title="');
        template.push(title);
        template.push('">');
      template.push('</td>');
      template.push('</tr>');
    }
    $('custom_topics').innerHTML = template.join('');
    if (keywords.length == MAX_CUS_TOPICS) {
      $('submit_button').disabled = true;
      $('newKeyword').readOnly = 'readonly';
    }
  }
  // Check all checkboxes(default settings) if no custom topic list and
  // checkbox topic list from local storage is found.
  if (!keywords && !topics) {
    for (var x = 0, topicList; topicList = topicLists[x]; x++) {
      topicList.checked = true;
      checkCount++;
    }
  }

  // Retrieves saved value of number of stories.
  var count = window.localStorage.getItem('count');

  // Sets number of stories in dropdown.
  if (count) {
    $('storyCount').value = count;
  }
}

/**
 * Saves checked topic list(if any), Custom topics(if any), number of
 * stories and country value in local storage.
 */
function saveTopicsCountry() {
  var country = $('countryList').value;
  var topicLists = document.getElementsByClassName('checkBox');

  // Contains selected number of stories.
  var count = $('storyCount').value;

  // Stores checked topics list.
  var topicArr = [];
  for (var i = 0, topicList; topicList = topicLists[i]; i++) {
    if (topicList.checked) {
      topicArr.push(topicList.value);
    }
  }
  var keywords = JSON.parse(window.localStorage.getItem('keywords'));

  // Saves custom topics to local storage(if any).
  if (tempCusTopics.length > 0) {
    if (keywords) {
      keywords = keywords.concat(tempCusTopics);
      window.localStorage.setItem('keywords', JSON.stringify(keywords));
    } else {
      window.localStorage.setItem('keywords', JSON.stringify(tempCusTopics));
    }
    tempCusTopics.splice(0, tempCusTopics.length);
  }

  // Saves checkbox topics(if any).
  if (topicArr.length > 0) {
    window.localStorage.setItem('topics', JSON.stringify(topicArr));
  } else {
    window.localStorage.removeItem('topics');
  }

  window.localStorage.setItem('count', count);
  window.localStorage.setItem('country', country);

  showUserMessages('save_status', 0.5, 'saveStatus');
  $('save_button').disabled = true;
}

/**
 * Disables the save button on options page if no topic is selected by the user.
 * @param {String} id Id of checkbox checked or unchecked.
 */
function manageCheckCount(id) {
  checkCount = ($(id).checked) ? (checkCount + 1) : (checkCount - 1);
  $('save_button').disabled = (checkCount == 0) ? true : false;
}

/**
 * Enables save button if at least one topic is selected.
 */
function enableSaveButton() {
  if (checkCount != 0) {
    $('save_button').disabled = false;
  }
}

/**
 * Adds new entered custom topic.
 */
function addCusTopic() {
  // Retrieves custom topic list from local storage(if any), else create new
  // array list.
  var keywords = JSON.parse(window.localStorage.getItem('keywords') || "[]");

  // Adds topic only if total number of added custom topics are less than 10.
  if (keywords.length + tempCusTopics.length <= (MAX_CUS_TOPICS - 1)) {

    // Stores new entered value in input textbox.
    var val = $('newKeyword').value;
    if (val) {
      val = val.trim();
      if (val.length > 0) {
        var pattern = /,/g;

        // Runs if comma(,) is not present in topic entered.
        if (val.match(pattern) == null) {
          checkCount++;
          tempCusTopics.push(val);

          // Template to store custom topics in a table.
          var template = [];
          var title = chrome.i18n.getMessage('deleteTitle');

          template.push('<tr style = "height: 22px;">');
          template.push('<td id = "keyword_value" class = "cusTopicsClass">');
          template.push('<textarea class="noborder" readonly>');
          template.push(val);
          template.push('</textarea>');
          template.push('<td class = "suppr" onclick = "delCusTopic(this)" ');
            template.push('title="');
            template.push(title);
            template.push('">');
          template.push('</td>');
          template.push('</tr>');

          $('custom_topics').innerHTML += template.join('');
          enableSaveButton();
        } else {
          showUserMessages('invalid_status', 2.5, 'invalidChars');
        }
      }
      $('newKeyword').value = '';
    }
  }

  if ((keywords.length + tempCusTopics.length) == (MAX_CUS_TOPICS)) {
    $('submit_button').disabled = true;
    $('newKeyword').readOnly = 'readonly';
  }
}

/**
 * Delete custom topic whenever users click on delete icon.
 * @param {HTMLTableColElement} obj HTML table column element to be deleted.
 */
function delCusTopic(obj) {
  // Deletes only if total number of topics are greater than 1, else shows
  // error message.
  if (checkCount > 1) {
    var value;

    // Extract custom topic value.
    value = obj.parentNode.querySelector('.cusTopicsClass textarea').value;

    // Removes custom topic element from UI.
    $('custom_topics').removeChild(obj.parentNode);

    // Removes custom topic element either from temporary array(if topic is
    // not yet saved) or from saved topic list and saves new list to
    // local storage.
    var flag = 0;
    for (var i = 0; i < tempCusTopics.length; i++) {
      if (tempCusTopics[i] == value) {
        tempCusTopics.splice(i, 1);
        flag = 1;
        break;
      }
    }

    if (flag == 0) {
      var keywords = JSON.parse(window.localStorage.getItem('keywords'));
      for (i = 0; i < keywords.length; i++) {
        if (keywords[i] == value) {
          keywords.splice(i, 1);
          break;
        }
      }
      if (keywords.length > 0) {
        window.localStorage.setItem('keywords', JSON.stringify(keywords));
      } else {
        window.localStorage.removeItem('keywords');
      }
    }

    checkCount--;
    $('submit_button').disabled = false;
  } else {
    showUserMessages('save_status', 2.5, 'noTopic');
  }
  $('newKeyword').readOnly = false;
}
