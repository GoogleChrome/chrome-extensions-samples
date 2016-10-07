document.getElementById("analytics_sample").addEventListener("click", function(e) {
    chrome.app.window.create("analytics/main.html", {
        width: 680,
        height: 480
    });
});

document.getElementById("analytics_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/analytics");
});

document.getElementById("appsquare_sample").addEventListener("click", function(e) {
    chrome.app.window.create("appsquare/main.html", {
        width: 300,
        height: 600
    });
});

document.getElementById("appsquare_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/appsquare");
});

document.getElementById("browser-tag_sample").addEventListener("click", function(e) {
    chrome.app.window.create("browser-tag/browser.html", {
        width: 1024,
        height: 768
    });
});

document.getElementById("browser-tag_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/browser-tag");
});

document.getElementById("calculator_sample").addEventListener("click", function(e) {
    chrome.app.window.create("calculator/calculator.html", {
        width: 250,
        height: 380
    });
});

document.getElementById("calculator_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/calculator");
});

document.getElementById("camera-capture_sample").addEventListener("click", function(e) {
    chrome.app.window.create("camera-capture/index.html", {
        width: 700,
        height: 600,
        type: "panel"
    });
});

document.getElementById("camera-capture_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/camera-capture");
});

document.getElementById("context-menu_sample").addEventListener("click", function(e) {
    chrome.app.window.create("context-menu/a.html", {
        top: 0,
        left: 0,
        width: 300,
        height: 300
    });
    chrome.app.window.create("context-menu/b.html", {
        top: 0,
        left: 310,
        width: 300,
        height: 300
    });
});

document.getElementById("context-menu_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/context-menu");
});

document.getElementById("diff_sample").addEventListener("click", function(e) {
    chrome.app.window.create("diff/main.html", {
        width: 1270,
        height: 800
    });
});

document.getElementById("diff_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/diff");
});

document.getElementById("eval-in-iframe_sample").addEventListener("click", function(e) {
    chrome.app.window.create("eval-in-iframe/main.html", {
        width: 400,
        height: 500
    });
});

document.getElementById("eval-in-iframe_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/eval-in-iframe");
});

document.getElementById("filesystem-access_source").addEventListener("click", function(e) {
    chrome.app.window.create("filesystem-access/index.html", {
        width: 800,
        height: 600
    });
});

document.getElementById("filesystem-access_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/filesystem-access");
});

document.getElementById("hello-world_sample").addEventListener("click", function(e) {
    chrome.app.window.create("hello-world/index.html", {
        width: 500,
        height: 309
    });
});

document.getElementById("hello-world_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/hello-world");
});

document.getElementById("ioio_sample").addEventListener("click", function(e) {
    chrome.app.window.create("ioio/index.html", {
        width: 640,
        height: 480
    });
});

document.getElementById("ioio_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/ioio");
});

document.getElementById("mini-code-edit_sample").addEventListener("click", function(e) {
    chrome.app.window.create("mini-code-edit/main.html", {
        frame: "chrome",
        width: 720,
        height: 400
    });
});

document.getElementById("mini-code-edit_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/mini-code-edit");
});

document.getElementById("sandboxed-content_sample").addEventListener("click", function(e) {
    chrome.app.window.create("sandboxed-content/main.html", {
        width: 400,
        height: 400,
        left: 0,
        top: 0
    });
    chrome.app.window.create("sandboxed-content/sandboxed.html", {
        width: 400,
        height: 400,
        left: 400,
        top: 0
    });
});

document.getElementById("sandboxed-content_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/sandboxed-content");
});

document.getElementById("serial-control-signals_sample").addEventListener("click", function(e) {
    chrome.app.window.create("serial-control-signals/main.html", {
        top: 0,
        left: 0,
        width: 640,
        height: 720
    });
});

document.getElementById("serial-control-signals_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/serial-control-signals");
});

document.getElementById("servo_sample").addEventListener("click", function(e) {
    chrome.app.window.create("servo/main.html", {
        top: 0,
        left: 0,
        width: 640,
        height: 720
    });
});

document.getElementById("servo_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/servo");
});

var singletonWindow;

document.getElementById("singleton_sample").addEventListener("click", function(e) {
    if (singletonWindow && !singletonWindow.closed) {
        console.log("Focusing singleton window");
        singletonWindow.chrome.app.window.focus();
    } else {
        console.log("Creating singleton window");
        chrome.app.window.create("singleton/singleton.html", {
            width: 500,
            height: 309,
            maxWidth: 500,
            maxHeight: 309,
            minWidth: 500,
            minHeight: 309
        }, function(w) {
            singletonWindow = w;
        });
    }
});

document.getElementById("singleton_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/singleton");
});

document.getElementById("storage_sample").addEventListener("click", function(e) {
    chrome.app.window.create("storage/main.html", {
        width: 400,
        height: 500
    });
});

document.getElementById("storage_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/storage");
});

document.getElementById("telnet_sample").addEventListener("click", function(e) {
    chrome.app.window.create("telnet/terminal.html", {
        width: 680,
        height: 480
    });
});

document.getElementById("telnet_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/telnet");
});

document.getElementById("text-editor_sample").addEventListener("click", function(e) {
    chrome.app.window.create("text-editor/editor.html");
});

document.getElementById("text-editor_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/text-editor");
});

document.getElementById("usbknob_sample").addEventListener("click", function(e) {
    chrome.app.window.create("usb/knob/knob.html", {
        width: 400,
        height: 400
    });
});

document.getElementById("usbknob_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/usb/knob");
});

document.getElementById("udp_sample").addEventListener("click", function(e) {
    chrome.app.window.create("udp/echo_mco.html", {
        width: 680,
        height: 480
    });
});

document.getElementById("udp_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/udp");
});

document.getElementById("windows_sample").addEventListener("click", function(e) {
    chrome.runtime.getBackgroundPage(function(background) {
        background.reset();
    });
    chrome.app.window.create("windows/original.html", {
        top: 128,
        left: 128,
        width: 300,
        height: 300,
        minHeight: 300,
        maxWidth: 500,
        minWidth: 300
    }, function(originalWindow) {
        windows.push(originalWindow);
        chrome.app.window.create("windows/copycat.html", {
            top: 128,
            left: 428 + 5,
            width: 300,
            height: 300,
            minHeight: 300,
            maxWidth: 500,
            minWidth: 300,
            frame: "none"
        }, function(copycatWindow) {
            windows.push(copycatWindow);
            updateInterval = setInterval(function() {
                if (originalWindow.closed || copycatWindow.closed) {
                    chrome.runtime.getBackgroundPage(function(background) {
                        background.reset();
                    });
                    return;
                }
                copycatWindow.moveTo(originalWindow.screenX + originalWindow.outerWidth + 5, originalWindow.screenY);
                copycatWindow.resizeTo(originalWindow.outerWidth, originalWindow.outerHeight);
            }, 10);
            originalWindow.chrome.app.window.focus();
        });
    });
});

document.getElementById("windows_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/windows");
});

document.getElementById("zephyr_sample").addEventListener("click", function(e) {
    chrome.app.window.create("zephyr_hxm/index.html", {
        width: 640,
        height: 480
    });
});

document.getElementById("zephyr_source").addEventListener("click", function(e) {
    window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/zephyr_hxm");
});
