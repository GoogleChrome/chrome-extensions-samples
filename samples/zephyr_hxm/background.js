// Defines the profile used by the Zephyr heart rate monitor
var HXM_PROFILE = {
  uuid: '00001101-0000-1000-8000-00805f9b34fb',
  name: 'Zephyr HXM Heart Rate Monitor'
};

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    bounds: {
      width: 600,
      height: 350
    },
    singleton: true,
    id: "bluetoothhxm"
  }, function(win) {
    // Add the profile to the list of profiles we support
    chrome.bluetooth.addProfile(HXM_PROFILE, function(r) {
      console.log("Profile added");
    });

    // Make the profile available in the main content window.
    win.contentWindow.HXM_PROFILE = HXM_PROFILE;
  });
});

function removeProfile() {
  console.log("Removing Zephyr HXM profile");
  chrome.bluetooth.removeProfile(HXM_PROFILE, function(r) {
    console.log("Profile removed");
  });
}

