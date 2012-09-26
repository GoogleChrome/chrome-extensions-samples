// Whole-script strict mode syntax
'use strict';

// module (WIP)
var foreman = {
  ui: {},
  regex: [],
  cregex: [],
  snapLookup: []
};

var model = {}
var activeTabAnchor;
var activeTabHref;
var rowid = 1;

var noteLookup = [];
var contextLookup = [];
var idnumLookup = {};
var extracts = {};
var keysFromStorage = {};

var B = Object.freeze({
  SETTINGS_WIDTH: 600,
  SETTINGS_HEIGHT: 450,
  ARCHIVE:'.archive-button',
  UNARCHIVE:'.unarchive-button',
  RESUME:'.resume-button',
  DELETE:'.delete-button',
  STORESEP: '_',
  STORE_META: 'meta',
  STORE_REGEX: 'regex',
  DATESEP: '-',
  SNAPKEY_PREFIX: 'd',
  STATE_PENDING: 'P',
  STATE_ACTIVE: 'A',
  SRC_REMOTE: 'remote',
  SRC_SAMPLE_JSON: 'sample-json',
  SRC_NEW_CONTEXT: 'new-context',
  SRC_SNAPSHOT: 'snapshot',
  SRC_DELETE: 'delete',
  SRC_RESUME: 'resume',
  DEFAULT_REGEX:
  [
    ['(http://code.google.com/p/chromium/issues/detail\\?id=)(\\d+)',
     '<a href="$1$2">crbug/$2</a>',
     'break'],
    ['(https://chromiumcodereview.appspot.com/)(\\d+)(/?)',
     '<a href="$1$2$3">cl$2</a>',
     'break'],
    ['(\\w*://)?(\\w+\\.\\S+)',
     '<a href="$1$2">$2</a>']
  ]
});

function setRegex(arg) {
  foreman.regex = arg;
  foreman.cregex = [];
  for (var i = 0; i < foreman.regex.length; ++i) {
    var e = foreman.regex[i];
    foreman.cregex.push(new RegExp(e[0]));
  }
}

function applyRegex(s) {
  for (var i = 0; i < foreman.regex.length; ++i) {
    var rep = s.replace(foreman.cregex[i], foreman.regex[i][1]);
    if (rep != s) {
      if (foreman.regex[i].length > 2 && foreman.regex[i][2] == 'break')
        return rep;
      s = rep;
    }
  }
  return s;
}

function snapshotOperation(op, arg) {
  var date = foreman.snapLookup[arg.get()[0].id.split('_')[1]];
  for (var i = 0; i < model.context.length; ++i) {
    var ctx = model.context[i];
    for (var j = 0; j < ctx.notes.length; ++j) {
      var note = ctx.notes[j];
      if (!note.snap || !note.snap[date])
        continue;
      if (op == 'UNDO' && !note.state)
        note.state = B.STATE_PENDING;
      if (op == 'UNDO' || op == 'DELETE')
        delete note.snap[date];
    }
  }
  modelReset(model);
}

var SNAPMENU_ACTIONS = {
  undoSnapshot: function undoSnapshot(arg) {
    snapshotOperation('UNDO', arg);
  },
  deleteSnapshot: function deleteSnapshot(arg) {
    snapshotOperation('DELETE', arg);
  },
  sendSnapshot: function sendSnapshot() {
    confirm('unimplemented');
  },
  alterSnapshot: function alterSnapshot() {
    prompt('unimplemented', currentSnapKey());
  }
};
var SNAPMENU_COMMON = {
  documentUrlPatterns: ['chrome-extension://*/window.html'],
  contexts: ['link'],
  targetUrlPatterns: ['chrome-extension://*/snapmenu.dummy']
};
var SNAPMENU_CMDS = [
  $.extend({
            id: 'undoSnapshot',
            title: 'Delete and Restore Pending',
           }, SNAPMENU_COMMON),
  $.extend({
            id: 'deleteSnapshot',
            title: 'Delete and Purge Pending',
           }, SNAPMENU_COMMON),
  $.extend({
            id: 'sendSnapshot',
            title: 'Send Snapshot to Snippets',
           }, SNAPMENU_COMMON),
  $.extend({
            id: 'alterSnapshot',
            title: 'Alter Snapshot Date',
           }, SNAPMENU_COMMON),
];

function snapshotMenu(date) {
  chrome.contextMenus.removeAll(function() {
    for (var i = 0; i < SNAPMENU_CMDS.length; ++i) {
      chrome.contextMenus.create(SNAPMENU_CMDS[i]);
    }
  });
}

function tabclick() {
  if (activeTabAnchor) {
    //restore this first, or we can not compare hrefs
    activeTabAnchor.attr('href', activeTabHref);
  }

  //find where the tab link points to
  var tabAnchor = $(this).find('a');
  var tabHref = tabAnchor.attr('href');

  if (tabHref == activeTabHref) {
    //same tab clicked -- remove href again and do nothing further
    activeTabAnchor.removeAttr('href');
    return false;
  }
  if (activeTabAnchor) {
    activeTabAnchor.attr('contentEditable', 'false');
  }
  activeTabAnchor = tabAnchor;
  activeTabHref = tabHref;

  //switch which tab appears active, and remove href so we don't look clicky
  $('ul.tabs li').removeClass('active').removeClass('cactive');
  if (activeTabHref == '#tabsnapshots' || activeTabHref == '#tabnew') {
    //"constant" / non-editable tabs
    $(this).addClass('cactive');
  } else {
    activeTabAnchor.attr('contentEditable', 'true');
    $(this).addClass('active');
  }

  $('.tab_content').hide();
  activeTabAnchor.removeAttr('href');

  $(activeTabHref).show();
  //$(activeTabHref).fadeIn();
  return false;
}

function installMenu(jqdom) {
  var ITEMS = SNAPMENU_CMDS;
  var FADE_TIME = 100;
  var listdom = $('<ul class="list">');
  for (var i = 0; i < ITEMS.length; ++i) {
    var item = ITEMS[i];
    listdom.append($('<li>')
      .attr('id', item.id)
      .append(item.title)
      .click(function(e) {
        listdom.fadeOut(FADE_TIME);
        SNAPMENU_ACTIONS[this.id](jqdom, item);
      })
    );
  }
  var divdom = $('<span class="menu">').append(listdom);
  jqdom.click(function() {listdom.fadeIn(FADE_TIME);});
  $(document)
    .keyup(function(event) { //fadeout on escape
      if (event.keyCode == 27)
        listdom.fadeOut(FADE_TIME);
    })
    .mousedown(function(){listdom.fadeOut(FADE_TIME);});
  return jqdom.before(divdom);
}

$(document).ready(function() {
  //Default Action
  $('.tab_content').hide(); //Hide all content
  $('ul.tabs li:first').addClass('active').show(); //Activate first tab
  $('.tab_content:first').show(); //Show first tab content
  $('ul.tabs li').click(tabclick);
});

function modelLookup(domObject) {
  var domID = domObject.attr('id');
  var idnum = domID.split('_')[1];
  return modelIndex(idnum);
}

function modelIndex(idnum) {
  var rval = {};
  rval.idnum = idnum;
  rval.note = noteLookup[idnum];
  rval.context = contextLookup[idnum];
  rval.snapshot = document.getElementById('snap_' + idnum);
  rval.td = document.getElementById('cell_' + idnum);
  rval.tr = document.getElementById('row_' + idnum);
  return rval;
}

//template-concept: find "{{text}}" replace with note['text']
function makeDomRow(templateDom, note, context, alternateTextSource) {
  var dom = templateDom.clone();
  var cell = dom.find('td').first();
  var idnum = rowid++;
  var tr_id = 'row_' + idnum;
  var td_id = 'cell_' + idnum;

  dom.attr('id', tr_id);
  cell.attr('id', td_id)
      .html(alternateTextSource ? alternateTextSource.text : note.text);

  //bind the <td> always to the model note object -- not just the text
  noteLookup[idnum] = note;
  contextLookup[idnum] = context;
  if (note.storageKey)
    idnumLookup[note.storageKey] = idnum;

  cell.bind('blur keyup paste', function() {cellChanged($(this));});
  return dom; //still a jQuery object here
}

function moveDomRow(modelPart, templateDom) {
  $('#row_' + modelPart.idnum).detach();
  var tr = makeDomRow(templateDom, modelPart.note, modelPart.context);
  noteLookup[modelPart.idnum] = null;
  contextLookup[modelPart.idnum] = null;
  return tr;
}

function currentSnapKey() {
  var now = new Date();
  return B.SNAPKEY_PREFIX + now.toISOString().replace(/[-:]/g, '');
}

function performSnapshot() {
  var key = currentSnapKey();
  for (var i = 0; i < model.context.length; ++i) {
    var ctx = model.context[i];
    for (var j = 0; j < ctx.notes.length; ++j) {
      var note = ctx.notes[j];
      var state = note.state; //keep, since we might delete it
      if (!state)
        continue;
      if (state === B.STATE_PENDING)
        delete note.state; //else: leave active
      if (!note.snap)
        note.snap = {};

      note.snap[key] = {
        text: note.text,
        state: state
      };
    }
  }
  modelReset(model, B.SRC_SNAPSHOT);
}

function saveModel(filter, store) {
  if (!store)
    store = foreman.store;
  if (filter && filter.note.storageKey) {
    var ob = {};
    ob[filter.note.storageKey] = filter.note;
    store.set(ob, function() {
        document.getElementById('status').innerHTML
              = 'sync ' + filter.note.storageKey + "@" + new Date();
    });
    return;
  }
  var numContexts = model.context.length;
  var snapshot = {meta: {}};
  var untouchedNotes = $.extend({}, keysFromStorage); //shallow copy
  for (var context_i = 0; context_i < numContexts; context_i++) {
    var prefix = 'c' + context_i;
    var ctx = model.context[context_i];
    snapshot.meta[prefix] = {};
    snapshot.meta[prefix].name = ctx.name;
    var num_notes = ctx.notes.length;
    for (var note_i = 0; note_i < num_notes; note_i++) {
      ctx.notes[note_i].storageKey = prefix + B.STORESEP + note_i;
      var storeKey = ctx.notes[note_i].storageKey;
      snapshot[storeKey] = ctx.notes[note_i];
      delete untouchedNotes[storeKey];
    }
  }
  var toRemove = Object.keys(untouchedNotes);
  if (toRemove.length > 0)
    store.remove(Object.keys(untouchedNotes));
  store.set(snapshot, function() {
    document.getElementById('status').innerHTML
        = 'full sync at ' + new Date();
  });
}

function cellChanged(cell) {
  var part = modelLookup(cell);
  part.note.text = cell.html();
  if (part.snapshot) {
    part.snapshot.innerHTML = cell.html();
  }
  saveModel(part);
}

function addTriggers(tabDOM) {
  function archiveActive() {
    var part = modelLookup($(this).parent().parent());
    part.note.state = B.STATE_PENDING;
    var tr = moveDomRow(part, tabDOM.trPending);
    $(B.UNARCHIVE, tr).click(unarchivePending);
    tabDOM.find('.pendingcontainer').append(tr);
    saveModel(modelLookup(tr));
  }
  function unarchivePending() {
    var part = modelLookup($(this).parent().parent());
    part.note.state = B.STATE_ACTIVE;
    var tr = moveDomRow(part, tabDOM.trActive); //replace
    $(B.ARCHIVE, tr).click(archiveActive);
    tabDOM.find('.activecontainer').append(tr);
    saveModel(modelLookup(tr));
  }
  function deleteActiveOrPending() {
    var part = modelLookup($(this).parent().parent());
    delete part.note.state; //keep snapshots
    modelReset(model, B.SRC_DELETE); //will remove if no snapshots
  }
  function resumeArchived() {
    var part = modelLookup($(this).parent().parent());
    part.note.state = B.STATE_ACTIVE;
    modelReset(model, B.SRC_RESUME); //
  }
  function addFromTextarea(tabDOM) {
    var s = applyRegex($('.entry', tabDOM).val());
    var note = {
      text: s,
      state: B.STATE_ACTIVE
    };
    tabDOM.context.notes.push(note);
    var tr = makeDomRow(tabDOM.trActive, note);
    $(B.ARCHIVE, tr).click(archiveActive);
    tabDOM.find('.activecontainer').append(tr);
    $('.entry', tabDOM).val('');
    saveModel(modelLookup(tr));
  }

  $(B.ARCHIVE, tabDOM).click(archiveActive);
  $(B.UNARCHIVE, tabDOM).click(unarchivePending);
  $(B.RESUME, tabDOM).click(resumeArchived);
  $(B.DELETE, tabDOM).click(deleteActiveOrPending);

  $('.addbutton', tabDOM).click(function() {
    addFromTextarea(tabDOM);
  });
  $('.paste-button', tabDOM).click(function() {
    $('.entry', tabDOM).text(Clipboard.getData());
    addFromTextarea(tabDOM);
  });
  $('.entry', tabDOM).keydown(function (e) {
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey) {
      addFromTextarea(tabDOM);
      return false;
    }
  });
}

function appendTab(key, context, clickFunc) {
  if (!clickFunc)
    clickFunc = tabclick;
  //create the tab, from the name
  $('<li>').append(
    $('<a>').attr('href', '#tab' + key).text(
      context.name
    ).bind('blur keyup paste', function() {
      context.name = $(this).text();
      saveModel();
    })
  )
  .attr('id', 'tabtab_' + key)
  .click(clickFunc)
  .addClass('tabtab')
  .appendTo('#tabs');
}

function snapshotTitle(key) {
  return 'Snapshot on ' + key.slice(1,5) + B.DATESEP + key.slice(5,7) + B.DATESEP + key.slice(7,9);
}

function formatExtract(extract) {
  if (extract.state && extract.state === B.STATE_ACTIVE)
    return $('<i>').append(extract.text);
  return extract.text;
}

function clearEmptyNotes(context) {
  var oldNotes = context.notes;
  context.notes = [];
  $.each(oldNotes, function(key, note) {
    if (note.state || !$.isEmptyObject(note.snap))
      context.notes.push(note);
  });
}

function appendContext(tabkey, context) {
  appendTab(tabkey, context);

  //create the content, initially hidden, from the templates in the DOM
  var tabDOM = $('#template-divTab').clone()
    .attr('id', 'tab' + tabkey)
    .attr('class', 'tab_content');
  tabDOM.trActive = tabDOM.find('#template-trActive').detach();
  tabDOM.trPending = tabDOM.find('#template-trPending').detach();
  tabDOM.divArchive = tabDOM.find('#template-divArchive').detach();
  tabDOM.trArchive = tabDOM.divArchive.find('#template-trArchive').detach();
  tabDOM.context = context;

  var active = [];
  var pending = [];
  var allSnap = [];
  var mapSnap = {};

  clearEmptyNotes(context);

  $.each(context.notes, function(key, note) {
    var resumable = false;
    switch (note.state) {
      case 'A':
        active.push(makeDomRow(tabDOM.trActive, note, context));
        break;
      case 'P':
        pending.push(makeDomRow(tabDOM.trPending, note, context));
        break;
      default:
        resumable = true;
    }
    if (!note.snap) {
      return; //no snapshots for this note
    }

    $.each(note.snap, function(date, extract) {
      var outerDom = mapSnap[date];
      var anchorName = 'tab' + key + '_' + date;
      if (!outerDom) {
        outerDom = tabDOM.divArchive.clone();
        outerDom.date = date; //we want to sort by this later
        outerDom.find('.snapheader').html(
          $('<a>').attr('id', anchorName)
            .append(snapshotTitle(date))
          );
        mapSnap[date] = outerDom;
        allSnap.push(outerDom);
      }
      var tr = makeDomRow(tabDOM.trArchive, note, context, extract);
      var part = modelLookup(tr);
      if (!resumable) {
        $(B.RESUME, tr).detach();
      }
      outerDom.find('.snapcontainer').append(tr);
      var extlist = extracts[date];
      if (!extlist) {
        extlist = [];
        extracts[date] = extlist;
      }
      var snapshotExtractID = 'snap_' + tr.attr('id').split('_')[1];
      var spandom = $('<span>')
          .attr('id', snapshotExtractID)
          .append(formatExtract(extract));
      extlist.push($('<tr>').append(
        $('<td>').append(
          $('<a>').attr('href', '#' + anchorName)
            .append(context.name)
            .click(function() {
              $('#tabtab_' + tabkey).click();
              var cell = $('#cell_' + part.idnum).focus();
              /* goal: move cursor to end of text (hard) */
              //var selection = window.getSelection();
              //selection.removeAllRanges();
              //range = document.createRange();
              //range.setStart(cell.get(), cell.text().length);
              //range.setEnd(cell.get(), cell.text().length);
              //selection.addRange(range);
              return true; //follow the href to scroll down (maybe)
            })
        ).append(' &middot; ').append(spandom)));
    });
  });

  //Sort snapshots by date
  allSnap.sort(function(lhs, rhs) {
    if (lhs.date == rhs.date)
      return 0;
    return lhs.date < rhs.date ? 1 : -1;
  });

  //more sorting; within nodes?

  $.each(active, function(idx, val) {
    tabDOM.find('.activecontainer').append(val);
  });
  $.each(pending, function(idx, val) {
    tabDOM.find('.pendingcontainer').append(val);
  });
  $.each(allSnap, function(idx, val) {
    tabDOM.append(val);
  });
  addTriggers(tabDOM);
  tabDOM.appendTo('#tabcontainer');
}

function loadSampleModel(why) {
  console.log('loading sample json (' + why + ')...');
  var jqxhr = $.getJSON('sampledata.json', {}, function(data) {
    modelReset(data, B.SRC_SAMPLE_JSON);
  })
  .error(function(response) {
    console.log(response);
    alert('Problem loading sample model');
  });
}

function modelReset(newmodel, src) {
  model = newmodel;
  activeTabAnchor = null;
  var reactivate = activeTabHref;
  activeTabHref = null;
  if (!reactivate)
    reactivate = 'snapshots';
  else
    reactivate = reactivate.slice(4);

  rowid = 1;
  extracts = {};

  $('.tab_content').detach();
  $('.tabtab').detach();

  appendTab('snapshots', {name: "Snapshots"});
  var snapDOM = $('#template-divSnapshots').clone()
    .attr('id', 'tabsnapshots')
    .attr('class', 'tab_content')
    .appendTo('#tabcontainer');

  $('.settings-button', snapDOM).click(function() {
    try {
      if (foreman.ui.settingsWindow) {
        foreman.ui.settingsWindow.focus();
        return;
      }
    } catch (e) {
      console.log('note:,', e, 'making new settings window.');
    }
    chrome.app.window.create('settings.html', {
      'height': B.SETTINGS_HEIGHT,
      'width': B.SETTINGS_WIDTH,
      'left': window.screenX + window.outerWidth,
      'top': window.screenY
    }, function(appWindow) {
      foreman.ui.settingsWindow = appWindow;
    });
  });
  $('.snapshot-button', snapDOM).click(function() {
    performSnapshot();
  });

  $.each(model['context'], appendContext);
  var extractDates = [];
  for (key in extracts) {
    extractDates.push(key);
  }
  extractDates.sort(function(lhs, rhs) {
    if (lhs == rhs) return 0;
    return lhs < rhs ? 1 : -1; //reverse
  });
  foreman.snapLookup = extractDates;

  $.each(extractDates, function(idx, date) {
    var rows = extracts[date];
    var tableDOM = $('<table>');
    $.each(rows, function(idx, tr) {
      tableDOM.append(tr);
    });
    var menuid = 'smenu_' + idx;
    $('<dl>')
      .append($('<dt>')
        .append(installMenu($('<button class="T-I menu-button" title="Tasks" id="b'+menuid+'">')))
/*
        .append($('<button class="menu-button T-I" title="Tasks">'))
        .append($('<a href="snapmenu.dummy" class="menu-anchor">'))
        .append($('<ul class="menu" style="display:none">')
          .append($('<li>').append($('<a tabindex="-1" href="#">test1</a>')))
          .append($('<li>').append($('<a tabindex="-1" href="#">test2</a>')))
          .append($('<li>').append($('<a tabindex="-1" href="#">test3</a>')))
        )
        .on('click', function() {
          var evt = document.createEvent("HTMLEvents");
          evt.initEvent('contextmenu', true, false, window, 1);
          //var menu = $('.snapmenu.dummy', this).get()[0]
          var menu = $('#' + menuid).get()[0];
          menu.dispatchEvent(evt);
          console.log(evt);
          document.dispatchEvent(evt);
          return true;
        })
*/
        .append(snapshotTitle(date))
        .append(' &middot; ')
        .append($('<a href="snapmenu.dummy" id="'+menuid+'">')
                .append('menu')
                .click(function(){return false;})
/*
                .on('mousedown', function(e) {
                  console.log('button = ' + e.button);
                  // try to convert to right-click... does not work :(
                  if (e.button != 2) {
                    var evt = document.createEvent("MouseEvents");
                    evt.initMouseEvent("mousedown", true, true, window,
                      1, e.screenX, e.screenY, e.clientX, e.clientY,
                      false, false, false, false, 2, null);
                    this.dispatchEvent(evt);
                    //setTimeout(function() {this.dispatchEvent(evt);}, 1000);
                    return true;
                  }
                  return true;
                })
                .click(function(){return false;})
*/
                )
      )
      .append($('<dd>').append(tableDOM))
      .appendTo('#tabsnapshots');
      $('#tabsnapshots :not(a[href^="#"])').attr('target','_blank');
  });
  appendTab('new', {name: "New"}, function() {
    model.context.push({name:'',  notes:[]});
    modelReset(model, B.SRC_NEW_CONTEXT);
    $('#tabtab_' + (model.context.length-1)).click().focus();
    return false;
  });
  $('#tabtab_' + reactivate).click();
  if (src != B.SRC_REMOTE)
    saveModel();
}

function loadFromStorage(syncmodel) {
  var jsonmodel = {context: []};
  $.each(syncmodel.meta, function(prefix, context) {
    var idx = prefix.slice(1);
    jsonmodel.context[idx] = {
      name : context.name,
      notes: []
    };
  });
  keysFromStorage = {};
  $.each(syncmodel, function(noteid, note) {
    if (noteid == B.STORE_META)
      return;
    if (noteid == B.STORE_REGEX) {
      setRegex(note);
      return;
    }
    var keys = noteid.split(B.STORESEP);
    if (noteid[0] != 'c' || keys.length != 2) {
      console.log("Deleting unknown/malformed key -- " + noteid);
      foreman.store.remove(noteid);
      return;
    }
    keysFromStorage[noteid] = 1;
    var context = jsonmodel.context[keys[0].slice(1)];
    if (!context) {
      console.log("No context for key -- " + noteid);
      return;
    }
    context.notes[keys[1]] = note;
  });
  modelReset(jsonmodel, 'foreman.store');
}

function changeTrigger(changes, namespace) {
  var kn = '';
  var vno = '';
  var vnn = '';
  var numChanges = 0;
  for (key in changes) {
    switch (key) {
    case B.STORE_META:
      delete changes[key];
      continue;
    case B.STORE_REGEX:
      setRegex(changes[key].newValue);
      delete changes[key];
      continue;
    }
    ++numChanges;
  }
  var redraw = false;
  var allmine = true;
  console.log(changes);
  console.log(namespace);

  if (true || numChanges == 1) {
    for (key in changes) {
      var change = changes[key];
      kn = key;
      if (!change.newValue.text)
        continue;
      if (!change.oldValue) {
        allmine = false;
        continue;
      }
      vnn = change.newValue.text;
      vno = change.oldValue.text;
      if (change.newValue.text) {
        var idnum = idnumLookup[key];
        if (idnum) {
          var part = modelIndex(idnum);
          if (part.note.text === change.oldValue.text) {
            part.note.text = change.newValue.text;
            part.note.state = change.newValue.state;
            part.note.snap = change.newValue.snap;
            allmine = false;
            redraw = true;
          } else if (part.note.text === change.newValue.text &&
                     part.note.state === change.newValue.state &&
                     JSON.stringify(part.snap) === JSON.stringify(change.newValue.snap)) {
            //probably mine
          } else {
            allmine = false;
          }
        } else { //probably new
          allmine = false;
        }
      }
    }
  }
  if (redraw) {
    modelReset(model, B.SRC_REMOTE);
    document.getElementById('status').innerHTML
          = 'remote sync at ' + (new Date()).toISOString();
  } else if (!allmine) {
    document.getElementById('status').innerHTML
          = 'remote change was not "simple" -- reload required';
  }

  console.log('%d changes, key[%d] %s --> %s', numChanges, kn, vno, vnn);

  for (key in changes) {
    var storageChange = changes[key];
    if (false) console.log('Storage key "%s" in namespace "%s" changed. ' +
                'Old value was "%s", new value is "%s".',
                key,
                namespace,
                storageChange.oldValue,
                storageChange.newValue);
  }
}

(function() {
  snapshotMenu();
  foreman.store = chrome.storage.local;
  chrome.storage.sync.get(null, function(syncmodel) {
    if (syncmodel.useSync === true) {
      foreman.store = chrome.storage.sync;
      loadFromStorage(syncmodel);
    } else {
      chrome.storage.local.get(null, function(localsync) {
        if (!localsync.meta) {
          loadSampleModel('"meta" not in local storage');
        } else {
          loadFromStorage(localsync);
        }
      });
    }
  });
  if (foreman.regex.length == 0)
    setRegex(B.DEFAULT_REGEX);

  chrome.storage.onChanged.addListener(changeTrigger);

  var minimizeNode = document.getElementById('minimize-button');
  if (minimizeNode) {
    minimizeNode.onclick = function() {
      chrome.runtime.getBackgroundPage(function(background) {
        background.minimizeAll();
      });
    };
  }
})();
