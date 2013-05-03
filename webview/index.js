
onload = function() {
	var $ = function(sel) {
		return document.querySelector(sel);
	};

	var wv1=$('#wv1');
	var wv2=$('#wv2');
	var wv3=$('#wv3');
	var logEl=$('textarea');

	function log(str) {
		logEl.value = str+"\n"+logEl.value;
	}

	function changeProperty(property, isCssAttribute, e) {
		var el = e.target;
		var value = el.value;
		if (isCssAttribute) {
			value = parseInt(el.value)+"px";
			wv1.style[property]=value;
		} else {  // else is element attribute
			wv1.setAttribute(property, value);
		}
		if (el.type=="range") {
			el.previousElementSibling.value=el.value;
		} else {
			el.nextElementSibling.value=el.value;
		}
	}

	['text', 'range'].map( function(inputtype) {
		$('.width .css_value input[type="'+inputtype+'"]').addEventListener('change',
			changeProperty.bind(this, 'width', true));
		$('.height .css_value input[type="'+inputtype+'"]').addEventListener('change',
			changeProperty.bind(this, 'height', true));
		$('.width .min input[type="'+inputtype+'"]').addEventListener('change',
			changeProperty.bind(this, 'minwidth', false));
		$('.height .min input[type="'+inputtype+'"]').addEventListener('change',
			changeProperty.bind(this, 'minheight', false));
		$('.width .max input[type="'+inputtype+'"]').addEventListener('change',
			changeProperty.bind(this, 'maxwidth', false));
		$('.height .max input[type="'+inputtype+'"]').addEventListener('change',
			changeProperty.bind(this, 'maxheight', false));
	});

	function logSizeChanged(e) {
		log("["+e.target.id+"] sizechanged: newWidth="+e.newWidth+" newHeight="+e.newHeight+" oldWidth="+e.oldWidth+" oldHeight="+e.oldHeight);
	}

	wv1.addEventListener('sizechanged', logSizeChanged);
	wv2.addEventListener('sizechanged', logSizeChanged);
	wv3.addEventListener('sizechanged', logSizeChanged);

	function sendInitialMessage(e) {
		// only send the message if the page was loaded from googledrive hosting
		e.target.contentWindow.postMessage("initial message", "https://googledrive.com/host/*");

	}

	function handlePermissionRequest(e) {
		var allowed = false;
	  if (e.permission==='pointerLock' || e.permission==='media' ||
	  		e.permission==='geolocation') {
	  	allowed = true;
    	e.request.allow();
  	} else {
  		e.request.deny();
  	}
		log("["+e.target.id+"] permissionrequest: permission="+e.permission+" "+
			(allowed?"allowed":"DENIED"));
	}

	window.addEventListener('message', function(e) {
		log("[???] messagereceived: "+e.data);
		console.log("received message", e);
	});

	wv1.addEventListener('loadstop', sendInitialMessage);
	wv2.addEventListener('loadstop', sendInitialMessage);
	wv3.addEventListener('loadstop', sendInitialMessage);

	wv1.addEventListener('permissionrequest', handlePermissionRequest);
	wv2.addEventListener('permissionrequest', handlePermissionRequest);
	wv3.addEventListener('permissionrequest', handlePermissionRequest);

}