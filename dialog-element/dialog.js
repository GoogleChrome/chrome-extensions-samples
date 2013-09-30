window.addEventListener("load", function(e) {
	var dialog = document.querySelector('#dialog1');
	document.querySelector('#show').addEventListener("click", function(evt) {
	  dialog.showModal();
	});
	document.querySelector('#close').addEventListener("click", function(evt) {
	  dialog.close("thanks!");
	});

	dialog.addEventListener("close", function(evt) {
		document.querySelector('#result').textContent = "You closed the dialog with: " + dialog.returnValue;
	});

	// called when the user Cancels the dialog, for example by hitting the ESC key
	dialog.addEventListener("cancel", function(evt) {
		dialog.close("canceled");
	});
});
