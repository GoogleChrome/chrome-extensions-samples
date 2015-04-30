// Use the runtime event listeners to set a window property indicating whether the
// app was launched normally or as a result of being restarted

chrome.app.runtime.onLaunched.addListener(function(data) {
    chrome.app.window.create('page.html', 
    	{innerBounds: {width:900, height:600, minWidth:900, maxWidth: 900, minHeight:600, maxHeight: 600}, id:"MGExp"}, 
    	function(app_win) {
    		app_win.contentWindow.__MGA__bRestart = false;
    	}
    );
    console.log("app launched");
});

chrome.app.runtime.onRestarted.addListener(function() {
    chrome.app.window.create('page.html', 
    	{innerBounds: {width:900, height:600, minWidth:900, maxWidth: 900, minHeight:600, maxHeight: 600}, id:"MGExp"}, 
    	function(app_win) {
    		app_win.contentWindow.__MGA__bRestart = true;
    	}
    );
    console.log("app restarted");
});
