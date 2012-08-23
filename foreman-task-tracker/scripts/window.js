var activeTabAnchor;
var activeTab;

$(document).ready(function() {
  //Default Action
  $(".tab_content").hide(); //Hide all content
  $("ul.tabs li:first").addClass("active").show(); //Activate first tab
  $(".tab_content:first").show(); //Show first tab content

  //On Click Event
  $("ul.tabs li").click(function() {
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
  });
});

onload = function() {
  function update() {


  }

  update();

  var minimizeNode = document.getElementById('minimize-button');
  if (minimizeNode) {
    minimizeNode.onclick = function() {
      chrome.runtime.getBackgroundPage(function(background) {
        background.minimizeAll();
      });
    };
  }
}

