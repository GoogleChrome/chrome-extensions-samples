#!/bin/bash

# Subroutines
function writeJS_header() {
  cat > ${BUILDDIR}/main.js <<EOF
var _dojo_apps={};

function _dojo_set_app_launcher(app, launcher) {
  _dojo_apps[app]=launcher;
}

function _dojo_launch(app) {
  if (_dojo_apps[app]) {
    _dojo_apps[app]();
  } else {
    console.log("Could not find app "+app);
  }
}

function _dojo_readme(file) {
  chrome.app.window.create(file,
    {bounds: {width: 500, height: 700, left: 602}});
}
function _dojo_source(app) {
  window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/"+app);
}

EOF
}


function writeJS_accumulatebgtasks() {
  cat ../${app}/$BGSCRIPT | \
     perl -pe "s/chrome.app.runtime.onLaunched.addListener\(/_dojo_set_app_launcher(\"$app_norm\", /g" |\
     perl -pe "s%(chrome.app.window.create.*?[\"'])%\1$app/%g" \
     >> ${BUILDDIR}/main.js
}

function writeJS_showsource() {
  cat >> ${BUILDDIR}/main.js <<EOF
    document.getElementById("${app_norm}_source").addEventListener("click", function(e) { _dojo_source("${app}"); });
EOF
}

function writeJS_launchapp() {
  cat >> ${BUILDDIR}/main.js <<EOF
    document.getElementById("${app_norm}_launch").addEventListener("click", function(e) { _dojo_launch("${app_norm}"); });
EOF
}

function writeJS_launch() {
  cat > ${BUILDDIR}/background.js <<EOF

chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    bounds: {
      width: 600,
      height: 800
    }
  });
});
EOF
}


function accumulate_appmanifestinfo() {
    # accumulate this apps' permissions
    if grep -q "permissions" ${MF} ; then
      cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"permissions"[^[]*\[(.*?)\].*/\1/g' | perl -pe 's/[^"]*"(.*?)"[^"]*/\1\n/g' >> $PERMFILE
    fi
    # accumulate this apps' sandboxed pages
    if grep -q "sandbox" ${MF} ; then 
      cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"sandbox"[^[]*\[(.*?)\].*/\1/g' | perl -pe "s/[^\"]*\"(.*?)\"[^\"]*/${app}\/\1\n/g" >> $SBFILE
    fi
}

function writeHTML_header() {
  cat > ${BUILDDIR}/index.html <<EOF
<html>
  <head>
    <title>Chrome Apps Dojo</title>
    <link rel="stylesheet" media="all" href="main.css"></link>
  </head>

  <body>
    <p>Choose a sample to start with, or simply start hacking right here (<b>right-click - Inspect Element</b>!)<br/>
    Read more at <a target="_blank" href="http://developer.chrome.com/apps">the Chrome Packaged Apps site</a></p>
    <ul class="apps">
EOF
}

function writeHTML_readme() {
  _readme=../${app}/README.md
  if [ -f ${_readme} ] ; then
    echo "&nbsp;<a id=\"${app_norm}_readme\" href=\"#\" class=\"readme\">(read more...)</a>" >> ${BUILDDIR}/index.html
    Markdown_1.0.1/Markdown.pl ${_readme} >> ${BUILDDIR}/readme_${app_norm}.html
    echo "document.getElementById(\"${app_norm}_readme\").addEventListener(\"click\", function(e) { _dojo_readme(\"readme_${app_norm}.html\"); });" >> ${BUILDDIR}/main.js 
  fi
}

function writeHTML_appicon() {
  NEWICONFILE="noicon.png"
  if grep -q "icons" ${MF} ; then 
    ICON=`cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"icons".*?"128"[^"]*"(.*?)".*/\1/g'`
    NEWICONFILE="icon_${app_norm}.png"
    cp "../${app}/${ICON}" ${BUILDDIR}/$NEWICONFILE
  fi
  echo "<img src=\"${NEWICONFILE}\"></img>" >> ${BUILDDIR}/index.html
}

function writeHTML_appitem() {
  echo "<li>" >> ${BUILDDIR}/index.html
  writeHTML_appicon
  echo "<h2>${app}</h2><p>${APPNAME}" >> ${BUILDDIR}/index.html
  writeHTML_readme
  echo "</p>" >> ${BUILDDIR}/index.html
  cat >> ${BUILDDIR}/index.html <<EOF
        <div class="actions">${_execute_button}<a href="#" id="${app_norm}_source">see source on GitHub</a></div>
   </li>
EOF
}

function writeHTML_footer() {
  cat >> ${BUILDDIR}/index.html <<EOF
    </ul>
    Want more? Catch 'em all on <a target="_blank" href="https://github.com/GoogleChrome/chrome-app-samples">GitHub</a>.
    
    <script src="main.js"></script>
  </body>
</html>
EOF
}


function writeManifest() {
  cat > ${BUILDDIR}/manifest.json <<EOF
{
  "name": "Chrome Apps Dojo",
  "version": "1",
  "manifest_version": 2,
  "icons": {
    "16": "dojo.png",
    "128": "dojo.png"
  },
  "app": {
    "background": {
      "scripts": ["background.js"]
    }
  },
  "permissions": [${PERMISSIONS}],
  "sandbox": {
    "pages": [${SANDBOXES}]
  }
}
EOF
}



# -----------  main code starts here

BUILDDIR='out'
TMP='tmp'
PERMFILE="${TMP}/permissions"
SBFILE="${TMP}/sandboxes"
EXECUTABLES="executable_list"

rm -Rf ${BUILDDIR}
rm -Rf ${TMP}

mkdir -p ${BUILDDIR}
mkdir -p ${TMP}

echo > ${PERMFILE}
echo > ${SBFILE}

writeJS_header
writeHTML_header

NON_EXECUTABLE=""

# get all apps which have manifest.json
for app in `find .. -name "manifest.json" -not -path "*/dojo/*" | perl -pe "s/\.\.\/(.*?)\/manifest.json/\1/"` ; do
  app_norm=`echo $app | tr '/' '_'`
  MF=../${app}/manifest.json
  if [ ! -f $MF ] ; then
   echo "Ignoring ${app}: Could not find manifest file ${MF}"
   continue
  fi
  APPNAME=`cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"name"[^"]*"(.*?)".*/\1/g'`
  # TODO: support more than one background script. Currently we don't have any case like this,
  # but this code will break if we have
  BGSCRIPT=`cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"background".*?"scripts"[^"]*"(.*?)".*/\1/g'`

  writeJS_showsource

  _execute_button=""

  # only allow inline execution of the app if it is in ${EXECUTABLES}
  if grep -q ${app} ${EXECUTABLES} ; then 
    accumulate_appmanifestinfo

    _execute_button="<button id=\"${app_norm}_launch\">execute</button><br/>"

    writeJS_accumulatebgtasks
    writeJS_launchapp

    mkdir -p ${BUILDDIR}/${app}
    cp -R ../${app}/* ${BUILDDIR}/${app}
  else
    NON_EXECUTABLE="${NON_EXECUTABLE} $app"
  fi

  writeHTML_appitem

done

if [ "x$NON_EXECUTABLE"!="x" ] ; then
  echo "Warning: the following apps are not in the ${EXECUTABLES} files, so they won't be executable from the Dojo app: ${NON_EXECUTABLE}" 
fi

PERMISSIONS=`cat $PERMFILE | sort | uniq | perl -pe 's/(.+)\n/"\1",/sg' | perl -pe 's/,$//g'`
SANDBOXES=`cat $SBFILE | sort | uniq | perl -pe 's/(.+)\n/"\1",/sg' | perl -pe 's/,$//g'`

writeManifest
writeJS_launch
writeHTML_footer


cp include/* ${BUILDDIR}

if [ "$1x" == "--nocrxx" ] ; then
  echo "No CRX generated. Use the out/ directory"
  exit 0;
fi

PEMFILE=${TMP}/key.pem

if [ ! -f ${PEMFILE} ] ; then
  openssl genrsa -out ${PEMFILE} 1024
  if [ ! -f ${PEMFILE} ] ; then
    echo Could not generate a private key file. Please check if you have openssl installed.
    exit 1
  fi
fi

./crxmake.sh ${BUILDDIR} ${PEMFILE} 

if [ ! -f "${BUILDDIR}.crx" ] ; then
  echo Could not create crx. Please try to run crxmake.sh by hand:
  echo ./crxmake.sh ${BUILDDIR} ${PEMFILE}
  exit 1
fi

mv ${BUILDDIR}.crx dojo.crx

echo "Successfuly created dojo.crx. You may now drag and drop it on your Chrome Extensions page"

