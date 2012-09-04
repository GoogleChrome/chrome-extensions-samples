var model;
var activeTabAnchor;
var activeTabHref;
var rowid = 1;
var noteid = 1;
var rownode = {};
var notenodes = {};
var extracts = {};
var snapshotPeer = {};

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
  if (activeTabHref == '#tabsnapshots') {
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

$(document).ready(function() {
  //Default Action
  $('.tab_content').hide(); //Hide all content
  $('ul.tabs li:first').addClass('active').show(); //Activate first tab
  $('.tab_content:first').show(); //Show first tab content
  $('ul.tabs li').click(tabclick);
});

function saveModel(filter) {
  if (filter) {
    return;
  }
  var num_contexts = model.context.length;
  var snapshot = {};
  snapshot.meta = {};
  for (var context_i = 0; context_i < num_contexts; context_i++) {
    var prefix = 'c' + context_i;
    var ctx = model.context[context_i];
    snapshot.meta[prefix] = {};
    snapshot.meta[prefix].name = ctx.name;
    var num_notes = ctx.notes.length;
    for (var note_i = 0; note_i < num_notes; note_i++) {
      snapshot[prefix + '.' + note_i] = ctx.notes[note_i];
    }
  }
  console.log(snapshot);
  chrome.storage.sync.set(snapshot, function() {
    document.getElementById('status').innerHTML
        = 'full sync at ' + new Date();
  });
}

//template-concept: find "{{text}}" replace with note['text']
function makeRowText(tpl, textob, noteob) {
  var dom = tpl.clone();
  var cell = dom.find('td').first();
  var id = 'row_'+rowid++;
  dom.attr('id', id);
  cell.html(textob.text);

  if (noteob) {
    //we are a snapshot -- link to a "peer"
    rownode[id] = noteob;
  } else {
    rownode[id] = textob;
  }
  cell.bind('blur keyup paste', function() {
    textob.text = $(this).html();
    var peer_span = document.getElementById('snap_' + id);
    if (peer_span) {
      peer_span.innerHTML = $(this).html();
    }
    saveModel();
  });
  return dom;
}

function addTriggers(tabDOM) {
  //ewwwwww too much copy-paste fixitfixitfixit
  function archiveActive() {
    var tr = $(this).parent().parent();
    tr.detach();
    var node = rownode[tr.attr('id')];
    node.state = 'P';
    tr = makeRowText(tabDOM.trPending, node); //replace
    $('.unarchivebutton', tr).click(unarchivePending);
    tabDOM.find('.pendingcontainer').append(tr);
  }
  function unarchivePending() {
    var tr = $(this).parent().parent();
    tr.detach();
    var node = rownode[tr.attr('id')];
    node.state = 'A';
    tr = makeRowText(tabDOM.trActive, node); //replace
    $('.archivebutton', tr).click(archiveActive);
    tabDOM.find('.activecontainer').append(tr);
  }
  function resumeArchived() {
    var tr = $(this).parent().parent();
    var node = rownode[tr.attr('id')];
    node.state = 'A';
    modelReset(model); //lazy

    //tr = makeRowText(tabDOM.trActive, node); //replace
    //$('.archivebutton', tr).click(archiveActive);
    //tabDOM.find('.activecontainer').append(tr);
    //$('.resumebutton', node).detach();
  }
  function addFromTextarea(tabDOM) {
    var note = {
      text: $('.entry', tabDOM).val(),
      state: 'A'
    };
    tabDOM.context.notes.push(note);
    var tr = makeRowText(tabDOM.trActive, note);
    $('.archivebutton', tr).click(archiveActive);
    tabDOM.find('.activecontainer').append(tr);
    $('.entry', tabDOM).val('');
  }

  $('.archivebutton', tabDOM).click(archiveActive);
  $('.unarchivebutton', tabDOM).click(unarchivePending);
  $('.resumebutton', tabDOM).click(resumeArchived);

  $('.addbutton', tabDOM).click(function() {
    addFromTextarea(tabDOM);
  });
  $('.entry', tabDOM).keydown(function (e) {
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey)
      addFromTextarea(tabDOM);
  });
}

function appendTab(key, context) {
  //create the tab, from the name
  $('<li>').append(
    $('<a>').attr('href', '#tab' + key).append(
      context.name
    )
  )
  .attr('id', 'tabtab_' + key)
  .click(tabclick)
  .addClass('tabtab')
  .appendTo('#tabs');
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

  $.each(context.notes, function(key, note) {
    var resumable = false;
    switch (note.state) {
      case 'A':
        active.push(makeRowText(tabDOM.trActive, note));
        break;
      case 'P':
        pending.push(makeRowText(tabDOM.trPending, note));
        break;
      default:
        resumable = true;
    }
    if (!note.snap)
      return; //no snapshots for this note

    $.each(note.snap, function(date, extract) {
      var outerDom = mapSnap[date];
      var anchorName = 'tab' + key + '_' + date;
      if (!outerDom) {
        outerDom = tabDOM.divArchive.clone();
        outerDom.date = date; //we want to sort by this later
        outerDom.find('.snapheader').html(
          $('<a>').attr('id', anchorName)
            .append('Snapshot on ' + date)
          );
        mapSnap[date] = outerDom;
        allSnap.push(outerDom);
      }
      var tr = makeRowText(tabDOM.trArchive, extract, note);
      if (!resumable) {
        $('.resumebutton', tr).detach();
      }
      outerDom.find('.snapcontainer').append(tr);
      var extlist = extracts[date];
      if (!extlist) {
        extlist = [];
        extracts[date] = extlist;
      }
      var snapshotExtractID = 'snap_' + tr.attr('id');
      var spandom = $('<span>')
          .attr('id', snapshotExtractID)
          .append(extract.text);
      extlist.push($('<tr>').append(
        $('<td>').append(
          $('<a>').attr('href', '#' + anchorName)
            .append(context.name)
            .click(function() {
              $('#tabtab_' + tabkey).click();
              return true; //follow the href to scroll down (maybe)
            })
        ).append(' &middot; ').append(spandom)));
//        ).append(extract)));
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
  noteid = 1;
  rownote = {};
  notenodes = {};
  extracts = {};

  $('.tab_content').detach();
  $('.tabtab').detach();

  appendTab('snapshots', {name: "Snapshots"});
  var snapDOM = $('#template-divSnapshots').clone()
    .attr('id', 'tabsnapshots')
    .attr('class', 'tab_content')
    .appendTo('#tabcontainer');

  $.each(model['context'], appendContext);
  var extractDates = [];
  for (key in extracts) {
    extractDates.push(key);
  }
  extractDates.sort(function(lhs, rhs) {
    if (lhs == rhs) return 0;
    return lhs < rhs ? 1 : -1; //reverse
  });

  $.each(extractDates, function(idx, date) {
    var rows = extracts[date];
    var tableDOM = $('<table>');
    console.log(rows);
    $.each(rows, function(idx, tr) {
      tableDOM.append(tr);
    });
    $('<dl>')
      .append($('<dt>').append('Snapshot on ' + date))
      .append($('<dd>').append(tableDOM))
      .appendTo('#tabsnapshots');
  });

  $('#tabtab_' + reactivate).click();
}

onload = function() {
  function loadSampleModel() {
    console.log('loading sample json..');
    var jqxhr = $.getJSON('sampledata.json', {}, function(data) {
      modelReset(data, 'complete1');
    })
    .error(function(response) {
      console.log(response);
      alert('Problem loading sample model');
    });
  }

  chrome.storage.sync.get(null, function(syncmodel) {
    if (!syncmodel.meta) {
      loadSampleModel();
    } else {
      var jsonmodel = {};
      jsonmodel.context = [];
      $.each(syncmodel.meta, function(prefix, context) {
        var idx = prefix.slice(1);
        jsonmodel.context[idx] = {
          name : context.name,
          notes: []
        };
      });
      $.each(syncmodel, function(noteid, note) {
        if (noteid == 'meta')
          return;
        var keys = noteid.split('.');
        if (noteid[0] != 'c' || keys.length != 2) {
          console.log("Deleting unknown/malformed key -- " + noteid);
          chrome.storage.sync.remove(noteid);
          return;
        }
        var context = jsonmodel.context[keys[0].slice(1)];
        if (!context) {
          console.log("No context for key -- " + noteid);
          return;
        }
        context.notes[keys[1]] = note;
      });
      console.log(jsonmodel);
      modelReset(jsonmodel, 'storage.sync');
    }

    chrome.storage.onChanged.addListener(function(changes, namespace) {
      for (key in changes) {
        var storageChange = changes[key];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
                    'Old value was "%s", new value is "%s".',
                    key,
                    namespace,
                    storageChange.oldValue,
                    storageChange.newValue);
      }
    });
  });

  var minimizeNode = document.getElementById('minimize-button');
  if (minimizeNode) {
    minimizeNode.onclick = function() {
      chrome.runtime.getBackgroundPage(function(background) {
        background.minimizeAll();
      });
    };
  }
}

