#!/bin/bash
BUILDDIR='build'
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

function _dojo_source(app) {
  window.open("https://github.com/GoogleChrome/chrome-app-samples/tree/master/"+app);
}

EOF

cat > ${BUILDDIR}/index.html <<EOF
<html>
  <head>
    <title>CrApp Dojo-jo!</title>
  </head>

  <body>
    <h2>Welcome to the Dojo-jo</h2>
    Choose a sample to start with, or simply start hacking right here (<b>right-click - Inspect Element</b>!):
    <ul style="list-style: none;">

EOF


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
  cat ../${app}/$BGSCRIPT | \
     perl -pe "s/chrome.experimental.app.onLaunched.addListener\(/_dojo_set_app_launcher(\"$app_norm\", /g" |\
     perl -pe "s%(chrome.app.window.create.*?[\"'])%\1$app/%g" \
     >> ${BUILDDIR}/main.js

  cat >> ${BUILDDIR}/main.js <<EOF
    document.getElementById("${app_norm}_source").addEventListener("click", function(e) { _dojo_source("${app_norm}"); });
EOF

  _execute_button=""

  # only allow inline execution of the app if it is in ${EXECUTABLES}
  if grep -q ${app} ${EXECUTABLES} ; then 
    # accumulate this apps' permissions
    if grep -q "permissions" ${MF} ; then
      cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"permissions"[^[]*\[(.*?)\].*/\1/g' | perl -pe 's/[^"]*"(.*?)"[^"]*/\1\n/g' >> $PERMFILE
    fi
    # accumulate this apps' sandboxed pages
    if grep -q "sandbox" ${MF} ; then 
      cat ${MF} | perl -pe 's/\n/ /sg' | perl -pe 's/.*"sandbox"[^[]*\[(.*?)\].*/\1/g' | perl -pe "s/[^\"]*\"(.*?)\"[^\"]*/${app}\/\1\n/g" >> $SBFILE
    fi
    _execute_button="<button id=\"${app_norm}_launch\">execute</button> &middot; "
  cat >> ${BUILDDIR}/main.js <<EOF
    document.getElementById("${app_norm}_launch").addEventListener("click", function(e) { _dojo_launch("${app_norm}"); });
EOF
    mkdir -p ${BUILDDIR}/${app}
    cp -R ../${app}/* ${BUILDDIR}/${app}

  fi
  cat >> ${BUILDDIR}/index.html <<EOF
    <li>${app} - ${APPNAME}: ${_execute_button} <a href="#" id="${app_norm}_source">see source on GitHub</a></li>
EOF

done

PERMISSIONS=`cat $PERMFILE | sort | uniq | perl -pe 's/(.+)\n/"\1",/sg' | perl -pe 's/,$//g'`
SANDBOXES=`cat $SBFILE | sort | uniq | perl -pe 's/(.+)\n/"\1",/sg' | perl -pe 's/,$//g'`

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

cat > ${BUILDDIR}/background.js <<EOF

chrome.experimental.app.onLaunched.addListener(function() {
  chrome.app.window.create('index.html', {
    width: 600,
    height: 800
  });
});
EOF

cat >> ${BUILDDIR}/index.html <<EOF
    </ul>
    Want more? Catch 'em all on <a href="https://github.com/GoogleChrome/chrome-app-samples">GitHub</a>.
    
    <script src="main.js"></script>
  </body>
</html>
EOF

cp include/* ${BUILDDIR}

