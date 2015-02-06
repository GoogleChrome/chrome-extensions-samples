'uses strict';

window.snippetSupport=(function() {

var sampleName = '';

function processFilesWithSnippets() {
  var xhr=new XMLHttpRequest();
  xhr.responseType='json';
  xhr.open('GET', '../sample_support_metadata.json');
  xhr.onload=function() {
    sampleName = this.response.sample;
  
    // extract from manifest:
    extractFromManifest();

    //extract from files with core snippets:
    var snippetsCount=this.response.files_with_snippets.length;
    for (var i=0; i<snippetsCount; i++) {
      var filename = this.response.files_with_snippets[i];
      var last = false;
      if (i==snippetsCount-1) {
        last = true;
      }
      getFileContents(filename, function(content) {
        extractSnippets(content, filename)
        if (last) {
          prettyPrint();
        }
      });
    }
  };
  xhr.send();
}

function extractFromManifest(content) {
  var manifest = chrome.runtime.getManifest();
  // remove common keys
  delete manifest.key
  delete manifest.name
  delete manifest.description
  delete manifest.manifest_version
  delete manifest.app
  delete manifest.version
  var note="// these are only some of the keys relevant to this sample\n"+
    "// for the complete manifest, click in the 'manifest.json' link above\n";
  addSnippet('Relevant manifest keys',
    { 'filename': 'manifest.json',
      'content': note+JSON.stringify(manifest, null, 2)
    });
}

function getFileContents(filename, callback) {
  var xhr=new XMLHttpRequest();
  xhr.open('GET', '../'+filename);
  xhr.onload=function() {
    callback(this.responseText);
  };
  xhr.send();
}

function addSnippet(snippetName, snippet) {
  var pre = document.createElement('pre');
  pre.classList.add('prettyprint');
  pre.innerText=snippet.content;
  var h2 = document.createElement('h2');
  h2.innerText=snippetName;
  var linkToGithub = document.createElement('span');
  var githubUrl='https://github.com/GoogleChrome/chrome-app-samples/tree/master/'+
    'samples/'+sampleName+'/'+snippet.filename;
  if (snippet.startLine) {
    githubUrl+='#L'+snippet.startLine+'-L'+snippet.endLine;
  }
  var githubUrlHTML = '<a target="_blank" href="'+githubUrl+'">'+snippet.filename;
  if (snippet.startLine) {
    githubUrlHTML += ' lines '+snippet.startLine+' to '+snippet.endLine;
  }
  githubUrlHTML += '</a>';
  linkToGithub.innerHTML = githubUrlHTML;
  h2.appendChild(linkToGithub)
  var div = document.createElement('div');
  div.classList.add('snippet');
  div.appendChild(h2);
  div.appendChild(pre);
  document.querySelector('.snippets').appendChild(div);
}

function extractSnippets(content, filename) {
  var lines=content.split('\n');
  var linesCount=lines.length;
  var reStart=/^\s*\/\/\s+@corecode_begin\s*([^ ]*)\s*$/;
  var reStop=/^\s*\/\/\s+@corecode_end\s*([^ ]*)\s*$/;
  var reSpaces=/^(\s*)/;
  var snippets={};
  var openSnippets={};
  var indentation={};
  var exec;
  for (var line=0; line<linesCount; line++) {
    exec=reStart.exec(lines[line]);
    if (exec && exec.length>1) {
      var snippetName = exec[1];
      // save the indentation
      var indent = reSpaces.exec(lines[line])[1].length;
      indentation[snippetName] = indent;
      openSnippets[snippetName] = snippetName;
      snippets[snippetName] = {"content": "", "filename": filename,
        "startLine": line+2};
    } else {
      exec=reStop.exec(lines[line]);
      if (exec && exec.length>1) {
        snippets[snippetKey].endLine=line;
        delete openSnippets[exec[1]];
      } else {
        for (var snippetKey in openSnippets) {
          var indent = indentation[snippetKey];
          var strippedLine=lines[line];
          // make sure we are not stripping non-whitespaces
          if (/^\s*$/.test(lines[line].substr(0, indent))) {
            strippedLine=lines[line].substr(indent);
          }
          snippets[snippetKey].content+=strippedLine+'\n';
        }
      }
    }
  }

  for (var snippetName in snippets) {
    addSnippet(snippetName, snippets[snippetName]);
  }
}

return {
    "processFilesWithSnippets": processFilesWithSnippets
  }

})();

document.addEventListener('DOMContentLoaded', function() {
  window.snippetSupport.processFilesWithSnippets();
});
