define(function(require, exports, module) {
"use strict";

var Mode = function(name, desc, extensions) {
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

function getModeFromBaseName(aBaseName) {
  var mode = null;
  for (var i = 0; i < modes.length; i++) {
    if (modes[i].supportsFile(aBaseName)) {
      mode = modes[i];
      break;
    }
  }
  return mode;
}

exports.getModeFromBaseName = getModeFromBaseName;

});
