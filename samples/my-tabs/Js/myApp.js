/*
var QUERY = 'kittens';var kittenGenerator={searchOnFlickr_: 'https://secure.flickr.com/services/rest/?'+'method=flickr.photos.search&'+'api_key=90485e931f687a9b9c2a66bf58a3861a&'+'text=' + encodeURIComponent(QUERY) + '&' +'safe_search=1&'+'content_type=1&' +'sort=interestingness-desc&' +'per_page=20',requestKittens: function() {var req = new XMLHttpRequest();req.open("GET", this.searchOnFlickr_, true);req.onload = this.showPhotos_.bind(this);req.send(null);},showPhotos_: function (e) {var kittens = e.target.responseXML.querySelectorAll('photo');for (var i = 0; i < kittens.length; i++) {var img = document.createElement('img');img.src = this.constructKittenURL_(kittens[i]);img.setAttribute('alt', kittens[i].getAttribute('title'));document.body.appendChild(img);}},
constructKittenURL_: function (photo) {return "http://farm" + photo.getAttribute("farm") +".static.flickr.com/" + photo.getAttribute("server") +"/" + photo.getAttribute("id") +"_" + photo.getAttribute("secret") +"_s.jpg";}};
document.addEventListener('DOMContentLoaded', function () {kittenGenerator.requestKittens();});
*/



function MYF(){
		this.appendList =function(tabId,tabTitle,tabFavIcon){
			$('#TabsTable').append(
				$('<tr>').attr({'id':tabId,'class':'rowId'}).append(
					$('<td>').attr({'class':'iconRw'}).append($('<img>').attr({'src':tabFavIcon})),
						$('<td>').attr({'class':"tabRow"}).text(tabTitle)
						));
				 $('.tr' ).show(2000);				
		},
		
		this.getTabChrome= function(){
		var that = this;
		chrome.windows.getCurrent({populate: true}, function(currentWindow) {
			chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
				var current = currentWindow.tabs.filter(function(tab) {
					that.appendList(tab.id,tab.title,tab.favIconUrl);
					return tab.active;
					})[0];
				});	
			});
		},
		this.emptyList= function(){
			$("#TabsTable").empty();
			$("#TopSitesTable").empty();
		},
		this.notifyMsg = function(){
			var tabs=[];
			chrome.tabs.query({currentWindow: true}, function(tabs) {
			chrome.browserAction.setBadgeText({text: ''+tabs.length});
				chrome.notifications.create('Tabs',{
						type:'basic',
						title:'Tabs Opened',
						iconUrl: 'Img/multi.png',
						message: tabs.length +' Are Tabs Opened!!',
						priority:0
						},function(){});
				});	
		},
		this.onAnchorClick = function(event){
			console.log("Clicked"+event.srcElement.href);
			chrome.tabs.create({ url: event.srcElement.href });
			return false;
		},
		
		this.buildPopupDom =function(mostVisitedURLs) {
				var popupDiv = document.getElementById('topSites_Div');
				var ol = popupDiv.appendChild(document.createElement('ol'));
			var that=this;
			for (var i = 0; i < mostVisitedURLs.length; i++) {
				var li = ol.appendChild(document.createElement('li'));
				var a = li.appendChild(document.createElement('a'));
				a.href = mostVisitedURLs[i].url;
				a.appendChild(document.createTextNode(mostVisitedURLs[i].title));
				a.addEventListener('click', that.onAnchorClick);
			}
		},
		this.topSy = function(){
		var that=this;
		chrome.topSites.get(that.buildPopupDom);
		}
	}
	
	
	
	
var TabsF = {
	openSelectedTab : function(selTabId){	
			/*chrome.windows.getCurrent({populate: true}, function(currentWindow) { */
					chrome.tabs.update(selTabId,{ active: true }, function() { 
				} );
			/*});*/
		},
	closeTabwithId :function(clsTabId){	
			chrome.windows.getCurrent({populate: true}, function(currentWindow) {
					chrome.tabs.remove(tab.id);
			});
		}
};
document.addEventListener('DOMContentLoaded', function(){
$( "#tTabs" ).parent().css({"color":"blue","text-decoration":"underline"} );
$('.topSites_Div').hide();
var tbs = new MYF();
	tbs.emptyList();
	tbs.getTabChrome();
	tbs.notifyMsg();
	//tbs.topSy();
});
document.addEventListener('contextmenu selectstart', function(e) {


e.preventDefault();
});
$(document).ready(function() {

	$('#tTabs').click(function(){
		$( "#tTabs").parent().css( {"color":"blue","text-decoration":"underline"} );
		$( "#tSites").parent().css( {"color":"black","text-decoration":"none"} );
		$('.Tabs_Div').show();
		$('.topSites_Div').hide();
	});
	
	$('#tSites').click(function(){
		$( "#tTabs" ).parent().css( {"color":"black","text-decoration":"none"}  );
		$( "#tSites" ).parent().css({"color":"blue","text-decoration":"underline"} );
		$('.Tabs_Div').hide();
		$('.topSites_Div').show();
	});

	$('#TabsTable').on("click","tr",function(){
          $('.rowId').click(function(){
			TabsF.openSelectedTab(parseInt($(this).attr('id')));
        });
    });
	
 }); 
 
 