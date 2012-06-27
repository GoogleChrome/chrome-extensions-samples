/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Skywriter.
 *
 * The Initial Developer of the Original Code is
 * Mozilla.
 * Portions created by the Initial Developer are Copyright (C) 2009
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *      Fabian Jakobs <fabian AT ajax DOT org>
 *      Kevin Dangoor (kdangoor@mozilla.com)
 *      Julian Viereck <julian DOT viereck AT gmail DOT com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */


define(function(require, exports, module) {
"use strict";

require("ace/lib/fixoldbrowsers");
require("ace/config").init();
var env = {};

var event = require("ace/lib/event");
var theme = require("ace/theme/textmate");
var EditSession = require("ace/edit_session").EditSession;
var UndoManager = require("ace/undomanager").UndoManager;

var vim = require("ace/keyboard/keybinding/vim").Vim;
var emacs = require("ace/keyboard/keybinding/emacs").Emacs;
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;

var modesByName;

// workers do not work for file:
if (location.protocol == "file:")
    EditSession.prototype.$useWorker = false;

var Doc = function(name, desc, file) {
    this.name = name;
    this.desc = desc;
    this.doc = new EditSession(file);
    this.doc.modeName = name;
    this.doc.setUndoManager(new UndoManager());
};

var WrappedDoc = function(name, desc, file) {
    Doc.apply(this, arguments);

    this.doc.setUseWrapMode(true);
    this.doc.setWrapLimitRange(80, 80);
};

var Mode = function(name, desc, extensions) {
    this.name = name;
    this.desc = desc;
    this.mode = "ace/mode/" + name;
    this.extRe = new RegExp("^.*\\.(" + extensions.join("|") + ")$", "g");
};

Mode.prototype.supportsFile = function(filename) {
    return filename.match(this.extRe);
};

var modes = [
    new Mode("c_cpp", "C/C++", ["c", "cpp", "cc", "cxx", "h", "hpp"]),
    new Mode("clojure", "Clojure", ["clj"]),
    new Mode("coffee", "CoffeeScript", ["coffee"]),
    new Mode("coldfusion", "ColdFusion", ["cfm"]),
    new Mode("csharp", "C#", ["cs"]),
    new Mode("css", "CSS", ["css"]),
    new Mode("golang", "Go", ["go"]),
    new Mode("groovy", "Groovy", ["groovy"]),
    new Mode("haxe", "haXe", ["hx"]),
    new Mode("html", "HTML", ["html", "htm"]),
    new Mode("java", "Java", ["java"]),
    new Mode("javascript", "JavaScript", ["js"]),
    new Mode("json", "JSON", ["json"]),
    new Mode("latex", "LaTeX", ["tex"]),
    new Mode("less", "LESS", ["less"]),
    new Mode("lua", "Lua", ["lua"]),
    new Mode("liquid", "Liquid", ["liquid"]),
    new Mode("markdown", "Markdown", ["md", "markdown"]),
    new Mode("ocaml", "OCaml", ["ml", "mli"]),
    new Mode("perl", "Perl", ["pl", "pm"]),
    new Mode("pgsql", "pgSQL", ["pgsql", "sql"]),
    new Mode("php", "PHP", ["php"]),
    new Mode("powershell", "Powershell", ["ps1"]),
    new Mode("python", "Python", ["py"]),
    new Mode("scala", "Scala", ["scala"]),
    new Mode("scss", "SCSS", ["scss"]),
    new Mode("ruby", "Ruby", ["rb"]),
    new Mode("sql", "SQL", ["sql"]),
    new Mode("svg", "SVG", ["svg"]),
    new Mode("text", "Text", ["txt"]),
    new Mode("textile", "Textile", ["textile"]),
    new Mode("xml", "XML", ["xml"]),
    new Mode("sh", "SH", ["sh"]),
    new Mode("xquery", "XQuery", ["xq"])
];

modesByName = {};
modes.forEach(function(m) {
    modesByName[m.name] = m;
});

var loreIpsum = require("ace/requirejs/text!./docs/plaintext.txt");
for (var i = 0; i < 5; i++) {
    loreIpsum += loreIpsum;
}

var doc = new Doc("c_cpp", "C / C++", "");

var keybindings = {
    // Null = use "default" keymapping
    ace: null,
    vim: vim,
    emacs: emacs,
    // This is a way to define simple keyboard remappings
    custom: new HashHandler({
        "gotoright":      "Tab",
        "indent":         "]",
        "outdent":        "[",
        "gotolinestart":  "^",
        "gotolineend":    "$"
     })
};

var container = document.getElementById("editor");

// Splitting.
var Split = require("ace/split").Split;
var split = new Split(container, theme, 1);
env.editor = split.getEditor(0);
split.on("focus", function(editor) {
    env.editor = editor;
    updateUIEditorOptions();
});
env.split = split;
window.env = env;
window.ace = env.editor;

var modeEl = document.getElementById("mode");
var wrapModeEl = document.getElementById("soft_wrap");
var themeEl = document.getElementById("theme");
var foldingEl = document.getElementById("folding");
var selectStyleEl = document.getElementById("select_style");
var highlightActiveEl = document.getElementById("highlight_active");
var showHiddenEl = document.getElementById("show_hidden");
var showGutterEl = document.getElementById("show_gutter");
var showPrintMarginEl = document.getElementById("show_print_margin");
var highlightSelectedWordE = document.getElementById("highlight_selected_word");
var showHScrollEl = document.getElementById("show_hscroll");
var animateScrollEl = document.getElementById("animate_scroll");
var softTabEl = document.getElementById("soft_tab");
var behavioursEl = document.getElementById("enable_behaviours");

modes.forEach(function(mode) {
    var option = document.createElement("option");
    option.setAttribute("value", mode.name);
    option.innerHTML = mode.desc;
    modeEl.appendChild(option);
});

bindDropdown("mode", function(value) {
    env.editor.getSession().setMode(modesByName[value].mode || modesByName.text.mode);
    env.editor.getSession().modeName = value;
});

var docdoc = doc.doc;
docdoc.setMode(modesByName[doc.name].mode);

var session = env.split.setSession(docdoc);
session.name = docdoc.name;
updateUIEditorOptions();
env.editor.focus();

function updateUIEditorOptions() {
    var editor = env.editor;
    var session = editor.session;

    session.setFoldStyle(foldingEl.value);

    saveOption(modeEl, session.modeName || "text");
    saveOption(wrapModeEl, session.getUseWrapMode() ? session.getWrapLimitRange().min || "free" : "off");

    saveOption(selectStyleEl, editor.getSelectionStyle() == "line");
    saveOption(themeEl, editor.getTheme());
    saveOption(highlightActiveEl, editor.getHighlightActiveLine());
    saveOption(showHiddenEl, editor.getShowInvisibles());
    saveOption(showGutterEl, editor.renderer.getShowGutter());
    saveOption(showPrintMarginEl, editor.renderer.getShowPrintMargin());
    saveOption(highlightSelectedWordE, editor.getHighlightSelectedWord());
    saveOption(showHScrollEl, editor.renderer.getHScrollBarAlwaysVisible());
    saveOption(animateScrollEl, editor.getAnimatedScroll());
    saveOption(softTabEl, session.getUseSoftTabs());
    saveOption(behavioursEl, editor.getBehavioursEnabled());
}

function saveOption(el, val) {
    if (!el.onchange || el.onclick)
        return;

    if ("checked" in el) {
        if (val !== undefined)
            el.checked = val;

        localStorage && localStorage.setItem(el.id, el.checked ? 1 : 0);
    }
    else {
        if (val !== undefined)
            el.value = val;

        localStorage && localStorage.setItem(el.id, el.value);
    }
}

bindDropdown("theme", function(value) {
    if (!value)
        return;
	env.editor.setTheme(value);
});

bindDropdown("keybinding", function(value) {
    env.editor.setKeyboardHandler(keybindings[value]);
});

bindDropdown("fontsize", function(value) {
    env.split.setFontSize(value);
});

bindDropdown("folding", function(value) {
    env.editor.getSession().setFoldStyle(value);
    env.editor.setShowFoldWidgets(value !== "manual");
});

bindDropdown("soft_wrap", function(value) {
    var session = env.editor.getSession();
    var renderer = env.editor.renderer;
    switch (value) {
        case "off":
            session.setUseWrapMode(false);
            renderer.setPrintMarginColumn(80);
            break;
        case "40":
            session.setUseWrapMode(true);
            session.setWrapLimitRange(40, 40);
            renderer.setPrintMarginColumn(40);
            break;
        case "80":
            session.setUseWrapMode(true);
            session.setWrapLimitRange(80, 80);
            renderer.setPrintMarginColumn(80);
            break;
        case "free":
            session.setUseWrapMode(true);
            session.setWrapLimitRange(null, null);
            renderer.setPrintMarginColumn(80);
            break;
    }
});

bindCheckbox("select_style", function(checked) {
    env.editor.setSelectionStyle(checked ? "line" : "text");
});

bindCheckbox("highlight_active", function(checked) {
    env.editor.setHighlightActiveLine(checked);
});

bindCheckbox("show_hidden", function(checked) {
    env.editor.setShowInvisibles(checked);
});

bindCheckbox("show_gutter", function(checked) {
    env.editor.renderer.setShowGutter(checked);
});

bindCheckbox("show_print_margin", function(checked) {
    env.editor.renderer.setShowPrintMargin(checked);
});

bindCheckbox("highlight_selected_word", function(checked) {
    env.editor.setHighlightSelectedWord(checked);
});

bindCheckbox("show_hscroll", function(checked) {
    env.editor.renderer.setHScrollBarAlwaysVisible(checked);
});

bindCheckbox("animate_scroll", function(checked) {
    env.editor.setAnimatedScroll(checked);
});

bindCheckbox("soft_tab", function(checked) {
    env.editor.getSession().setUseSoftTabs(checked);
});

bindCheckbox("enable_behaviours", function(checked) {
    env.editor.setBehavioursEnabled(checked);
});


var secondSession = null;
bindDropdown("split", function(value) {
    var sp = env.split;
    if (value == "none") {
        if (sp.getSplits() == 2) {
            secondSession = sp.getEditor(1).session;
        }
        sp.setSplits(1);
    } else {
        var newEditor = (sp.getSplits() == 1);
        if (value == "below") {
            sp.setOrientation(sp.BELOW);
        } else {
            sp.setOrientation(sp.BESIDE);
        }
        sp.setSplits(2);

        if (newEditor) {
            var session = secondSession || sp.getEditor(0).session;
            var newSession = sp.setSession(session, 1);
            newSession.name = session.name;
        }
    }
});

function bindCheckbox(id, callback) {
    var el = document.getElementById(id);
    if (localStorage && localStorage.getItem(id))
        el.checked = localStorage.getItem(id) == "1";

    var onCheck = function() {
        callback(!!el.checked);
        saveOption(el);
    };
    el.onclick = onCheck;
    onCheck();
}

function bindDropdown(id, callback) {
    var el = document.getElementById(id);
    if (localStorage && localStorage.getItem(id))
        el.value = localStorage.getItem(id);

    var onChange = function() {
        callback(el.value);
        saveOption(el);
    };

    el.onchange = onChange;
    onChange();
}

function onResize() {
    var left = env.split.$container.offsetLeft;
    var width = document.documentElement.clientWidth - left;
    container.style.width = width + "px";
    container.style.height = document.documentElement.clientHeight + "px";
    env.split.resize();
}

window.onresize = onResize;
env.editor.renderer.onResize(true);

event.addListener(container, "dragover", function(e) {
    return event.preventDefault(e);
});

function replaceDocContentsFromString(string) {
    env.editor.getSelection().selectAll();
    if (string) {
        env.editor.onTextInput(string);
    } else {
        var range = env.editor.getSelectionRange();
        env.editor.session.remove(range);
        env.editor.clearSelection();
    }
}

var currentFilename = "foo.txt";

function replaceDocContentsFromFile(file) {
    if (window.FileReader) {
        var reader = new FileReader();
        reader.onload = function() {
            currentFilename = file.name;
            var mode = modesByName.text;
            for (var i = 0; i < modes.length; i++) {
                if (modes[i].supportsFile(file.name)) {
                    mode = modes[i];
                    break;
                }
            }

            replaceDocContentsFromString(reader.result);

            modeEl.value = mode.name;
            env.editor.getSession().setMode(mode.mode);
            env.editor.getSession().modeName = mode.name;
        };
        reader.readAsText(file);
    }
}

function replaceDocContentsFromFileEntry(entry) {
    entry.file(replaceDocContentsFromFile);
}

event.addListener(container, "drop", function(e) {
    var file;
    try {
        entry = e.dataTransfer.items[0].webkitGetAsEntry(function(entry) {
            replaceDocContentsFromFileEntry(entry);
        });
        //file = e.dataTransfer.files[0];
    } catch(err) {
        return event.stopEvent();
    }

    //replaceDocContentsFromFile(file);

    return event.preventDefault(e);
});

var commands = env.editor.commands;

commands.addCommand({
    name: "copy",
    bindKey: {
        win: "Ctrl-C",
        mac: "Command-C",
        sender: "editor"
    },
    exec: function() {
        document.execCommand("copy");
    }
});

commands.addCommand({
    name: "paste",
    bindKey: {
        win: "Ctrl-V",
        mac: "Command-V",
        sender: "editor"
    },
    exec: function() {
        document.execCommand("paste");
    }
});

commands.addCommand({
    name: "cutX",
    bindKey: {
        win: "Ctrl-X",
        mac: "Command-X",
        sender: "editor"
    },
    exec: function() {
        document.execCommand("cut");
    }
});

// add multiple cursor support to editor
require("ace/multi_select").MultiSelect(env.editor);

var showingConfig = false;

function showhideConfig() {
    var controlsEl = document.getElementById("controlspanel");
    showingConfig = !showingConfig;
    var newLeft = -242;
    if (showingConfig)
        newLeft += 300;
    controlsEl.style.left = newLeft + "px";
}

var configbuttonEl = document.getElementById("config");
configbuttonEl.onclick = showhideConfig;

function newDocument() {
    replaceDocContentsFromString("");
}

var newbuttonEl = document.getElementById("new");
newbuttonEl.onclick = newDocument;

var fileinputEl = document.getElementById("openfileinput");
function openFile() {
    if (fileinputEl.files.length === 0) { return; }
    var file = fileinputEl.files[0];

    replaceDocContentsFromFile(file);
}

fileinputEl.onchange = openFile;

var openfilebuttonEl = document.getElementById("openfile");
openfilebuttonEl.onclick = function() {fileinputEl.click();};

var Intent = window.Intent || window.WebKitIntent;
var startActivity = window.navigator.startActivity || window.navigator.webkitStartActivity;
window.intent = window.intent || window.webkitIntent;

function openFromWeb() {
  var i = new Intent("http://webintents.org/pick", "text/*");
  startActivity.call(window.navigator, i, function(data) {
    replaceDocContentsFromString(data);
  });
}

var openwebbuttonEl = document.getElementById("openweb");
openwebbuttonEl.onclick = openFromWeb;

var savelinkEl = document.getElementById("savelink");
function saveClicked() {
  var bb = new (window.BlobBuilder || window.WebKitBlobBuilder)();
  bb.append(env.editor.session.getDocument().getValue());
  var blob = bb.getBlob("text/plain");
  savelinkEl.download = currentFilename;
  savelinkEl.href = window.webkitURL.createObjectURL(blob);
}

savelinkEl.onclick = saveClicked;

var saveasbuttonEl = document.getElementById("saveas");
saveasbuttonEl.onclick = function() {savelinkEl.click();};

if (launchData && launchData.intent && launchData.intent.data)
  replaceDocContentsFromFileEntry(launchData.intent.data);

});
