var activeTabAnchor;
var activeTab;

function tabclick() {
  if (activeTabAnchor) {
    //restore this first, or we can not compare hrefs
    activeTabAnchor.attr("href", activeTab);
  }

  //find where the tab link points to
  var tabAnchor = $(this).find("a");
  var tab = tabAnchor.attr("href");

  if (tab == activeTab) {
    //same tab clicked -- remove href again and do nothing further
    activeTabAnchor.removeAttr("href");
    return false;
  }
  if (activeTabAnchor) {
    activeTabAnchor.attr("contentEditable", 'false');
  }
  activeTabAnchor = tabAnchor;
  activeTab = tab;
  if (tab != "#snapshots") {
    activeTabAnchor.attr("contentEditable", 'true');
  }

  $("ul.tabs li").removeClass("active"); //Remove any "active" class
  $(this).addClass("active"); //Add "active" class to selected tab
  $(".tab_content").hide(); //Hide all tab content
  activeTabAnchor.removeAttr("href");
  $(activeTab).fadeIn(); //Fade in the active content
  return false;
}

$(document).ready(function() {
  //Default Action
  $(".tab_content").hide(); //Hide all content
  $("ul.tabs li:first").addClass("active").show(); //Activate first tab
  $(".tab_content:first").show(); //Show first tab content

  //On Click Event
  $("ul.tabs li").click(tabclick);
});

function append_context(key, val) {
  //create the tab, from the name
  $("<li>").append(
    $("<a>").attr("href", "#tab" + key).append(
      val['name']
    )
  )
  .click(tabclick)
  .appendTo('#tabs');
  //create the content, initially hidden

}

function model_reset(newmodel, src) {
  model = newmodel;
  console.log("from " + src + ": " + model);
  $.each(model, function(key, val) {
    console.log('got key: ' + key);
  });
  $.each(model['context'], append_context);
}

onload = function() {
  function load_sample_model() {
    console.log('loading sample json..');
    var jqxhr = $.getJSON('sampledata.json', {}, function(data) {
      model_reset(data, 'complete1');
    })
    .error(function(response) {
      console.log(response);
      alert('Problem loading sample model');
    });
  }

  chrome.storage.sync.get("syncmodel", function(syncmodel) {
    if (!syncmodel['context']) {
      load_sample_model();
    } else {
      model = syncmodel;
      console.log('loaded storage model -- model=' + model);
      model_reset(syncmodel, 'storage');
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

