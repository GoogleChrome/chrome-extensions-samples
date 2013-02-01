
onload = function() {
	var $ = function(sel) {
		return document.querySelector(sel);
	};

	var wv1=$('#wv1');
	var wv2=$('#wv2');
	var wv3=$('#wv3');
	var logEl=$('textarea');

	var log = function(str) {
		logEl.value = str+"\n"+logEl.value;
	}

	var changeProperty = function(property, isCssAttribute, e) {
		var el = e.target;
		var value = parseInt(el.value)+"px";
		if (isCssAttribute) {
			wv1.style[property]=value;
		} else {  // else is element attribute
			wv1.setAttribute(property, value);
		}
		if (el.type=="range") {
			el.previousElementSibling.value=el.value;
		} else {
			el.nextElementSibling.value=el.value;
		}
	};

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

	var logSizeChanged = function(e) {
		log("["+e.target.id+"] sizechanged: newWidth="+e.newWidth+" newHeight="+e.newHeight+" oldWidth="+e.oldWidth+" oldHeight="+e.oldHeight);
	};

	wv1.addEventListener('sizechanged', logSizeChanged);
	wv2.addEventListener('sizechanged', logSizeChanged);
	wv3.addEventListener('sizechanged', logSizeChanged);

}