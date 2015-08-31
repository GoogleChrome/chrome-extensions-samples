var findTool = (function() {
  var VISIBLE_STYLE = 'block';
  var HIDDEN_STYLE = 'none';
  var containerElement = null, browserInstance = null, controller = null;
  var form = null, findText = null, matchCase = null, findBackward = null,
  findForward = null, findResult = null;
  var findMatchCase = false;
  function query(id) {
    return containerElement.querySelector(id);
  }

  var FindController = function(container, browser) {
    containerElement = container;
    browserInstance = browser;
    form = query('#find-form');
    findText = query('#find-text');
    findResults = query('#find-results');
    findBackward = query("#find-backward");
    findForward = query("#find-forward");
    matchCase = query("#match-case");
    controller = this;
    initHandlers();
  }

  FindController.prototype.deactivate = function() {
    if (isVisible) {
      hideBox();
    }
  };

  function isVisible() {
    return containerElement.style.display ==  VISIBLE_STYLE;
  }

  function hideBox() {
    containerElement.style.display = HIDDEN_STYLE;
  }

  function showBox() {
    setWebviewFindUpdateHandler();
    containerElement.style.display = VISIBLE_STYLE;
    findText.select();
  }

  FindController.prototype.toggleVisibility = function() {
    if (isVisible()) {
      hideBox();
    } else {
      showBox();
    }
  };

  function findTextOnInput(e) {
    browserInstance.tabs.getSelected().webview.find(
      findText.value, {matchCase: findMatchCase});
  }

  function findTextOnKeyDown(e) {
    if (e.ctrlKey && e.keyCode == 13) {
      e.preventDefault();
      browserInstance.tabs.getSelected().webview.stopFinding('activate');
      hideBox();
    }
  }
  function matchCaseOnClick(e) {
    e.preventDefault();
    findMatchCase = !findMatchCase;
    if (findMatchCase) {
      matchCase.style.color = 'blue';
      matchCase.style['font-weight'] = 'bold';
    } else {
      matchCase.style.color = 'black';
      matchCase.style['font-weight'] = "";
    }
    browserInstance.tabs.getSelected().webview.find(
      findText.value, {matchCase: findMatchCase});
  }

  function formOnSubmit(e) {
    e.preventDefault();
    browserInstance.tabs.getSelected().webview.find(
      findText.value, {matchCase: findMatchCase});
  }

  function findBackwardOnClick(e) {
    e.preventDefault();
    browserInstance.tabs.getSelected().webview.find(
      findText.value, {backward: true, matchCase: findMatchCase});
  }

  function handleFindUpdate(e) {
    if (e.searchText == "") {
      findResults.innerText = "";
    } else {
      findResults.innerText =
      event.activeMatchOrdinal + " of " + event.numberOfMatches;
    }
    // Ensure that the find box does not obscure the active match
    if (e.finalUpdate && !e.canceled) {
      containerElement.style.left = '';
      containerElement.style.opacity = '';
      var rect = containerElement.getBoundingClientRect();
      if (containerElementObscuresActiveMatch(rect, e.selectionRect)) {
        var potentialLeft = e.selectionRect.left - rect.width - 10;
        if (potentialLeft >= 5) {
          containerElement.style.left = potentialLeft + 'px';
        }  else {
          containerElement.style.opacity = "0.5";
        }
      }
    }
  }

  function containerElementObscuresActiveMatch(findBoxRect, matchRect) {
    return findBoxRect.left < matchRect.left + matchRect.width &&
    findBoxRect.right > matchRect.left &&
    findBoxRect.top < matchRect.top + matchRect.height &&
    findBoxRect.bottom > matchRect.top;

  }

  function handleKeyDown(e) {
    // Check for Ctrl + F
    if (e.ctrlKey && e.keyCode == 70) {
      showBox();
    }
  }

  function initHandlers() {
    findText.addEventListener('input', findTextOnInput);
    findText.addEventListener('keydown', findTextOnKeyDown);
    matchCase.addEventListener('click', matchCaseOnClick);
    form.addEventListener('submit', formOnSubmit);
    window.addEventListener('keydown', handleKeyDown);
  }

  function setWebviewFindUpdateHandler() {
    if (browserInstance && browserInstance.tabs) {
      for (var index = 0; index < browserInstance.tabs.getNumTabs(); ++index) {
        var wv = browserInstance.tabs.selectIdx(index).webview;
        wv.onfindupdate = handleFindUpdate;
        wv.stopFinding();
      }
    }
  }
  return {'FindController': FindController};
})();
