var activeTabAnchor;
var activeTabHref;

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

function append_context(key, val) {
  //create the tab, from the name
  $('<li>').append(
    $('<a>').attr('href', '#tab' + key).append(
      val['name']
    )
  )
  .click(tabclick)
  .appendTo('#tabs');

  //create the content, initially hidden
  var tabDOM = $('#template-divTab').clone().attr('id', 'tab' + key);
  var trActive = tabDOM.find('#template-trActive').detach();
  var trPending = tabDOM.find('#template-trPending').detach();
  var divArchive = tabDOM.find('#template-divArchive').detach();

  var active = [];
  var pending = [];
  var snaps = {};
  function makeRowText(dom, text) {
    dom.find('td').first().html(text);
    return dom;
  }
  $.each(val['notes'], function(key, val) {
    noteState = val['state'];
    switch (noteState) {
      case 'A':
        active.push(makeRowText(trActive.clone(), val['text']));
        console.log(active);
        break;
      case 'P':
        pending.push(makeRowText(trPending.clone(), val['text']));
        break;
      default:
        ; //undefined // skip
    }
  });

  //apply sorting?

  $.each(active, function(key, val) {
    tabDOM.find('.activecontainer').append(val);
  });
  $.each(pending, function(key, val) {
    tabDOM.find('.pendingcontainer').append(val);
  });
  //tabDOM.find('.pendingcontainer').append(pending);
  tabDOM.appendTo('#tabcontainer');
}

function modelReset(newmodel, src) {
  model = newmodel;
  console.log('from ' + src + ': ' + model);
  $.each(model, function(key, val) {
    console.log('got key: ' + key);
  });
  $.each(model['context'], append_context);
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

