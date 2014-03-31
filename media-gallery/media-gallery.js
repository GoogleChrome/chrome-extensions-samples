var gGalleryIndex = 0;     // gallery currently being iterated
var gGalleryReader = null; // the filesytem reader for the current gallery
var gDirectories = [];     // used to process subdirectories
var gGalleryArray = [];    // holds information about all top-level Galleries found - list of DomFileSystem
var gGalleryData = [];     // hold computed information about each Gallery
var gCurOptGrp = null;
var imgFormats = ['png', 'bmp', 'jpeg', 'jpg', 'gif', 'png', 'svg', 'xbm', 'webp'];
var audFormats = ['wav', 'mp3'];
var vidFormats = ['3gp', '3gpp', 'avi', 'flv', 'mov', 'mpeg', 'mpeg4', 'mp4', 'ogg', 'webm', 'wmv'];

function errorPrintFactory(custom) {
   return function(e) {
      var msg = '';

      switch (e.code) {
         case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
         case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
         case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
         case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
         case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
         default:
            msg = 'Unknown Error';
            break;
      };

      console.log(custom + ': ' + msg);
   };
}

function GalleryData(id) {
   this._id = id;
   this.path = "";
   this.sizeBytes = 0;
   this.numFiles = 0;
   this.numDirs = 0;
}

function addImageToContentDiv() {
   var content_div = document.getElementById('content');
   var image = document.createElement('img');
   content_div.appendChild(image);
   return image;
}

function addAudioToContentDiv() {
   var content_div = document.getElementById('content');
   var audio = document.createElement('audio');
   audio.setAttribute("controls","controls");
   content_div.appendChild(audio);
   return audio;
}

function addVideoToContentDiv() {
   var content_div = document.getElementById('content');
   var audio = document.createElement('video');
   audio.setAttribute("controls","controls");
   content_div.appendChild(audio);
   return audio;
}

function getFileType(filename) {
   var ext = filename.substr(filename.lastIndexOf('.') + 1).toLowerCase();
   if (imgFormats.indexOf(ext) >= 0)
      return "image";
   else if (audFormats.indexOf(ext) >= 0)
      return "audio";
   else if (vidFormats.indexOf(ext) >= 0)
      return "video";
   else return null;
}

function clearContentDiv() {
   var content_div = document.getElementById('content');
   while (content_div.childNodes.length >= 1) {
      content_div.removeChild(content_div.firstChild);
   }
}
function clearList() {
   document.getElementById("GalleryList").innerHTML = "";
}

function updateSelection(e) {
   var selList = document.getElementById("GalleryList");
   var indx = selList.selectedIndex;
   var fsId = selList.options[indx].getAttribute("data-fsid");
   var fs = null;

   // get the filesystem that the selected file belongs to
   for (var i=0; i < gGalleryArray.length; i++) {
      var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(gGalleryArray[i]);
      if (mData.galleryId == fsId) {
         fs = gGalleryArray[i];
         break;
      }
   }
   if (fs) {
      var path = selList.options[indx].getAttribute("data-fullpath");
      fs.root.getFile(path, {create: false}, function(fileEntry) {
         var newElem = null;
         // show the file data
         clearContentDiv();
         var type = getFileType(path);
         if (type == "image")
            newElem = addImageToContentDiv();
         else if (type == "audio")
            newElem = addAudioToContentDiv();
         else if (type == "video")
            newElem = addVideoToContentDiv();

         if (newElem)
            newElem.src = fileEntry.toURL();
      });
   }
}

function addGallery(name, id) {
   var optGrp = document.createElement("optgroup");
   optGrp.setAttribute("label",name);
   optGrp.setAttribute("id", id);
   document.getElementById("GalleryList").appendChild(optGrp);
   return optGrp;
}

function addItem(itemEntry) {
   var opt = document.createElement("option");
   if (itemEntry.isFile) {
      opt.setAttribute("data-fullpath", itemEntry.fullPath);

      var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(itemEntry.filesystem);
      opt.setAttribute("data-fsid", mData.galleryId);
   }
   opt.appendChild(document.createTextNode(itemEntry.name));
   gCurOptGrp.appendChild(opt);
}

function scanGallery(entries) {
   // when the size of the entries array is 0, we've processed all the directory contents
   if (entries.length == 0) {
      if (gDirectories.length > 0) {
         var dir_entry = gDirectories.shift();
         console.log('Doing subdir: ' + dir_entry.fullPath);
         gGalleryReader = dir_entry.createReader();
         gGalleryReader.readEntries(scanGallery, errorPrintFactory('readEntries'));
      }
      else {
         gGalleryIndex++;
         if (gGalleryIndex < gGalleryArray.length) {
            console.log('Doing next Gallery: ' + gGalleryArray[gGalleryIndex].name);
            scanGalleries(gGalleryArray[gGalleryIndex]);
         }
      }
      return;
   }
   for (var i = 0; i < entries.length; i++) {
      console.log(entries[i].name);

      if (entries[i].isFile) {
         addItem(entries[i]);
         gGalleryData[gGalleryIndex].numFiles++;
         (function(galData) {
            entries[i].getMetadata(function(metadata){
               galData.sizeBytes += metadata.size;
            });
         }(gGalleryData[gGalleryIndex]));
      }
      else if (entries[i].isDirectory) {
         gDirectories.push(entries[i]);
      }
      else {
         console.log("Got something other than a file or directory.");
      }
   }
   // readEntries has to be called until it returns an empty array. According to the spec,
   // the function might not return all of the directory's contents during a given call.
   gGalleryReader.readEntries(scanGallery, errorPrintFactory('readMoreEntries'));
}

function scanGalleries(fs) {
   var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(fs);

   console.log('Reading gallery: ' + mData.name);
   gCurOptGrp = addGallery(mData.name, mData.galleryId);
   gGalleryData[gGalleryIndex] = new GalleryData(mData.galleryId);
   gGalleryReader = fs.root.createReader();
   gGalleryReader.readEntries(scanGallery, errorPrintFactory('readEntries'));
}

function getGalleriesInfo(results) {
   clearContentDiv();
   if (results.length) {
      var str = 'Gallery count: ' + results.length + ' ( ';
      results.forEach(function(item, indx, arr) {
         var mData = chrome.mediaGalleries.getMediaFileSystemMetadata(item);

         if (mData) {
            str += mData.name;
            if (indx < arr.length-1)
               str += ",";
            str += " ";
         }
      });
      str += ')';
      document.getElementById("filename").innerText = str;
      gGalleryArray = results; // store the list of gallery directories
      gGalleryIndex = 0;

      document.getElementById("scan-button").disabled = "";
   }
   else {
      document.getElementById("filename").innerText = 'No galleries found';
      document.getElementById("scan-button").disabled = "disabled";
   }
}

window.addEventListener("load", function() {
   // __MGA__bRestart is set in the launcher code to indicate that the app was
   // restarted instead of being normally launched
   if (window.__MGA__bRestart) {
      console.log("App was restarted");
      // if the app was restarted, get the media gallery information
      chrome.mediaGalleries.getMediaFileSystems({
         interactive : 'if_needed'
      }, getGalleriesInfo);
   }

   document.getElementById('gallery-button').addEventListener("click", function() {
      chrome.mediaGalleries.getMediaFileSystems({
         interactive : 'if_needed'
      }, getGalleriesInfo);
   });
   document.getElementById('configure-button').addEventListener("click", function() {
      chrome.mediaGalleries.getMediaFileSystems({
         interactive : 'yes'
      }, getGalleriesInfo);
   });
   document.getElementById('add-folder-button').addEventListener("click", function() {
      chrome.mediaGalleries.addUserSelectedFolder(getGalleriesInfo);
   });
   document.getElementById('scan-button').addEventListener("click", function () {
      clearContentDiv();
      clearList();
      if (gGalleryArray.length > 0) {
         scanGalleries(gGalleryArray[0]);
      }
   });
   document.getElementById('GalleryList').addEventListener("change", function(e) {
      updateSelection(e);
   });
});

