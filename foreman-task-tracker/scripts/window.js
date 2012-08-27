var activeTabAnchor;
var activeTabHref;
var model;

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
  $('ul.tabs li').removeClass('active').removeClass('constActive');
  if (tabHref == '#snapshots') {
    //"constant" / non-editable tabs
    $(this).addClass('constActive');
  } else {
    activeTabAnchor.attr('contentEditable', 'true');
    $(this).addClass('active');
  }

  $('.tab_content').hide();
  activeTabAnchor.removeAttr('href');

  $(activeTabHref).fadeIn();
  return false;
}

$(document).ready(function() {
  //Default Action
  $('.tab_content').hide(); //Hide all content
  $('ul.tabs li:first').addClass('active').show(); //Activate first tab
  $('.tab_content:first').show(); //Show first tab content

  //On Click Event
  $('ul.tabs li').click(tabclick);
});

function saveModel() {
  console.log(model);
}

function appendContext(key, context) {
  //create the tab, from the name
  $('<li>').append(
    $('<a>').attr('href', '#tab' + key).append(
      context['name']
    )
  )
  .click(tabclick)
  .appendTo('#tabs');

  //create the content, initially hidden, from the templates in the DOM
  var tabDOM = $('#template-divTab').clone().attr('id', 'tab' + key);
  var trActive = tabDOM.find('#template-trActive').detach();
  var trPending = tabDOM.find('#template-trPending').detach();
  var divArchive = tabDOM.find('#template-divArchive').detach();
  var trArchive = divArchive.find('#template-trArchive').detach();

  var active = [];
  var pending = [];
  var allSnap = [];
  var mapSnap = {};

  //template-concept: find "{{text}}" replace with note['text']
  function makeRowText(tpl, noteob) {
    var note = noteob.text;
    var dom = tpl.clone();
    var cell = dom.find('td').first();
    cell.html(note);
    cell.bind('blur keyup paste', function() {
      noteob.text = $(this).html();
      saveModel();
    });
    return dom;
  }
  $.each(context.notes, function(key, note) {
    switch (note.state) {
      case 'A':
        active.push(makeRowText(trActive, note));
        break;
      case 'P':
        pending.push(makeRowText(trPending, note));
        break;
      default:
        ; //undefined // skip
    }
    if (!note.snap)
      return; //no snapshots for this note

    $.each(note.snap, function(date, extract) {
      var outerDom = mapSnap[date];
      if (!outerDom) {
        outerDom = divArchive.clone();
        outerDom.date = date; //we want to sort by this later
        outerDom.find('.snapheader').html('Snapshot on ' + date);
        mapSnap[date] = outerDom;
        allSnap.push(outerDom);
      }
      outerDom.find('.snapcontainer').append(makeRowText(trArchive, extract));
    });
  });

  //apply sorting?

  $.each(active, function(idx, val) {
    tabDOM.find('.activecontainer').append(val);
  });
  $.each(pending, function(idx, val) {
    tabDOM.find('.pendingcontainer').append(val);
  });
  $.each(allSnap, function(idx, val) {
    tabDOM.append(val);
  });
  tabDOM.appendTo('#tabcontainer');
}

function modelReset(newmodel, src) {
  model = newmodel;
  console.log('from ' + src + ': ' + model);
  $.each(model, function(key, val) {
    console.log('got key: ' + key);
  });
  $.each(model['context'], appendContext);
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

  chrome.storage.sync.get('syncmodel', function(syncmodel) {
    if (!syncmodel['context']) {
      loadSampleModel();
    } else {
      model = syncmodel;
      console.log('loaded storage model -- model=' + model);
      modelReset(syncmodel, 'storage');
    }
  });

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

  var minimizeNode = document.getElementById('minimize-button');
  if (minimizeNode) {
    minimizeNode.onclick = function() {
      chrome.runtime.getBackgroundPage(function(background) {
        background.minimizeAll();
      });
    };
  }
}

